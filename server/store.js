const OpenAI = require('openai');
const path = require('path');
const fs = require('fs');

const MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === 'sk-your-key-here') {
    throw new Error('请在 .env 文件中配置 OPENAI_API_KEY');
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '120000', 10),
  });
}

/**
 * 调用 LLM，返回 JSON 格式的结果
 */
async function callLLM(systemPrompt, userPrompt) {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  if (!response.choices || response.choices.length === 0) {
    throw new Error('LLM 返回空响应（可能触发了安全过滤），请修改输入后重试');
  }

  const content = response.choices[0].message.content;
  try {
    return JSON.parse(content);
  } catch (e) {
    throw new Error(`LLM 返回的 JSON 解析失败: ${content.substring(0, 200)}`);
  }
}

/**
 * 调用 LLM，返回纯文本结果
 */
async function callLLMText(systemPrompt, userPrompt) {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.3,
  });
  if (!response.choices || response.choices.length === 0) {
    throw new Error('LLM 返回空响应（可能触发了安全过滤），请修改输入后重试');
  }
  return response.choices[0].message.content;
}

// ============ 数据管理 ============

const DATA_DIR = path.join(__dirname, '..', 'data');
let writeLock = Promise.resolve();

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getMapPath() {
  return path.join(DATA_DIR, 'cognition-map.json');
}

function getBackupPath() {
  return path.join(DATA_DIR, 'cognition-map.backup.json');
}

function loadMap() {
  const filePath = getMapPath();
  if (!fs.existsSync(filePath)) return createEmptyMap();
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(data);
    // Basic validation: must have dimensions array
    if (!parsed || !Array.isArray(parsed.dimensions)) {
      throw new Error('Invalid map structure');
    }
    // Sync category from categories[].dimIds → dimensions[].category
    syncCategoryToDimensions(parsed);
    return parsed;
  } catch (e) {
    console.error(`[store] Failed to load map: ${e.message}`);
    // If file exists but is corrupted, try to restore from backup
    const backupPath = getBackupPath();
    if (fs.existsSync(backupPath)) {
      try {
        const backupData = fs.readFileSync(backupPath, 'utf-8');
        const parsed = JSON.parse(backupData);
        if (parsed && Array.isArray(parsed.dimensions)) {
          console.warn('[store] Restored from backup');
          // Save the restored backup as the main file
          fs.writeFileSync(filePath, backupData, 'utf-8');
          return parsed;
        }
      } catch (backupErr) {
        console.error(`[store] Backup also corrupted: ${backupErr.message}`);
      }
    }
    // No valid backup, rename corrupted file and return empty
    const corruptPath = filePath + '.corrupt';
    if (fs.existsSync(filePath)) {
      fs.renameSync(filePath, corruptPath);
      console.warn(`[store] Corrupted file moved to ${corruptPath}`);
    }
    return createEmptyMap();
  }
}

function saveMap(map) {
  // Use a simple promise chain as a write lock to prevent concurrent writes
  writeLock = writeLock.then(() => {
    ensureDataDir();
    const filePath = getMapPath();
    // Always keep a backup before writing
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, getBackupPath());
      } catch (e) {
        console.error(`[store] Failed to create backup: ${e.message}`);
      }
    }
    map.lastUpdated = new Date().toISOString().split('T')[0];
    fs.writeFileSync(filePath, JSON.stringify(map, null, 2), 'utf-8');
    return map;
  });
  return writeLock;
}

function createEmptyMap() {
  return {
    version: 3,
    owner: '',
    lastUpdated: new Date().toISOString().split('T')[0],
    speakers: [],
    categories: [],
    dimensions: [],
    sourceLog: [],
    combinations: [],
    blindSpots: [],
    developmentPaths: [],
    radarAxes: [],
  };
}

// ============ ID 生成 ============

let idCounter = Date.now();
function nextId(prefix) {
  idCounter++;
  return `${prefix}_${idCounter.toString(36)}`;
}

// ============ 维度分类同步 ============

/**
 * 从 categories[].dimIds 反向同步到 dimensions[].category
 * 确保每个维度的 category 字段与分类关系一致
 */
function syncCategoryToDimensions(map) {
  if (!map.categories || !map.dimensions) return;
  // Build dimId → catId mapping from categories
  const dimCatMap = {};
  for (const cat of map.categories) {
    for (const dimId of (cat.dimIds || [])) {
      dimCatMap[dimId] = cat.id;
    }
  }
  // Apply to dimensions
  for (const dim of map.dimensions) {
    if (dimCatMap[dim.id]) {
      dim.category = dimCatMap[dim.id];
    }
  }
}

// ============ 雷达轴盲区同步 ============

/**
 * 将盲区引用同步到雷达轴 blindIds
 * 在 blindspots.js 和 analyze.js 中共用，避免重复代码
 */
function syncBlindSpotsToRadarAxes(map) {
  // First, clear all existing blindIds
  for (const axis of map.radarAxes) {
    axis.blindIds = [];
  }
  // Then, re-assign based on current blindSpots
  for (const blind of map.blindSpots) {
    for (const axis of map.radarAxes) {
      if (blind.relatedDimensions && blind.relatedDimensions.some(rid =>
        axis.dimIds && axis.dimIds.includes(rid)
      )) {
        if (!axis.blindIds.includes(blind.id)) axis.blindIds.push(blind.id);
      }
    }
  }
}

module.exports = {
  callLLM,
  callLLMText,
  loadMap,
  saveMap,
  createEmptyMap,
  nextId,
  MODEL,
  syncBlindSpotsToRadarAxes,
};
