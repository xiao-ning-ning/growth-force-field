const express = require('express');
const router = express.Router();
const { callLLM, loadMap, saveMap, nextId, syncBlindSpotsToRadarAxes } = require('../store');

// POST /api/analyze - 分析录音文本
router.post('/', async (req, res) => {
  try {
    const { transcript, speakerName, sourceName, date } = req.body;
    if (!transcript || !speakerName) {
      return res.status(400).json({ error: '缺少必要参数: transcript, speakerName' });
    }

    const map = loadMap();
    const existingDimsSummary = map.dimensions.map(d => ({
      id: d.id, name: d.name, status: d.status, category: d.category,
      evidenceCount: d.evidence.length, description: d.description,
    }));

    const systemPrompt = `你是"成长力场"的分析引擎，专门从录音转写文本中提取人的行为特征和能力维度。

核心信念：人对自己能力的认知往往存在盲区——有些能力每天都在用，但从未命名和显性化。

## 分析原则

1. **证据驱动，不预设维度**: 维度是从行为中长出来的，不是预设的框架
2. **已具备和待发展都要有证据**: 待发展不是主观评价，而是从行为中观察到的信号
3. **原文引用必须有**: 每条证据必须附原文引用
4. **解读要有判断力**: 不是简单复述原话，而是点出原话背后展现的能力或能力缺口
5. **confidence 要诚实**: 单次证据="弱"，两次以上="中"，三次以上且跨场景="强"
6. **维度命名要精准**: 用"战略拆解力"而非"规划能力"，用"温和的残酷"而非"决策力"
7. **待发展不是否定**: 待发展维度是用来看见潜力和缺口

## 重点分析维度

- 决策方式（如何做判断、如何权衡取舍）
- 沟通模式（如何引导、如何提问、如何回应）
- 思维结构（如何拆解问题、如何建立因果链）
- 价值观表达（重视什么、反对什么、权衡标准）
- 情绪与关系处理（如何面对冲突、如何照顾他人感受）
- 能力缺口信号（哪些场景只给方向不给方案、哪些领域停留在类比未落地）

## 输出格式

返回 JSON，格式如下：
{
  "owner": "说话人名称",
  "newDimensions": [
    {
      "name": "维度名称",
      "status": "possessed|developing",
      "categoryName": "分类名称",
      "categoryIcon": "emoji图标",
      "description": "一句话定义该维度的核心内涵",
      "evidence": {
        "source": "来源名称",
        "speaker": "说话人",
        "quote": "原文引用",
        "interpretation": "AI对这段行为的解读"
      },
      "confidence": "强|中|弱",
      "relatedTo": ["已有维度id或新维度名称"]
    }
  ],
  "updatedDimensions": [
    {
      "dimensionId": "已有维度ID",
      "newEvidence": {
        "source": "来源名称",
        "speaker": "说话人",
        "quote": "原文引用",
        "interpretation": "AI对这段行为的解读"
      },
      "confidenceChange": "强|中|弱|不变",
      "statusChange": "possessed|developing|不变"
    }
  ],
  "mergeSuggestions": [
    {
      "dimensionIds": ["dim_xxx", "dim_yyy"],
      "reason": "合并理由",
      "suggestedName": "合并后的维度名称"
    }
  ],
  "summary": "本次分析的摘要说明"
}`;

    const userPrompt = `## 待分析的录音转写文本

来源: ${sourceName || '未命名录音'}
日期: ${date || new Date().toISOString().split('T')[0]}
目标说话人: ${speakerName}

### 文本内容
${transcript}

## 已有维度（共 ${map.dimensions.length} 个）
${existingDimsSummary.length > 0 ? existingDimsSummary.map(d =>
  `- [${d.id}] ${d.name} (${d.status}, ${d.evidenceCount}条证据): ${d.description}`
).join('\n') : '（暂无已有维度，这是首次分析）'}

请深度分析上述文本中"${speakerName}"的行为模式，提取能力维度。`;

    const result = await callLLM(systemPrompt, userPrompt);

    // 处理分析结果，更新地图
    const updates = processAnalysisResult(map, result, speakerName, sourceName, date);

    await saveMap(map);

    res.json({
      success: true,
      map,
      updates,
      summary: result.summary,
    });

  } catch (error) {
    console.error('分析失败:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 处理分析结果，将新维度和更新写入地图
 */
function processAnalysisResult(map, result, speakerName, sourceName, date) {
  const updates = { newDims: [], updatedDims: [], mergeSuggestions: [], radarAxesChanges: [] };
  const sourceDate = date || new Date().toISOString().split('T')[0];
  const sourceLabel = sourceName || '未命名录音';

  // 确保 speaker 存在
  let speaker = map.speakers.find(s => s.name === speakerName);
  if (!speaker) {
    speaker = { id: nextId('speaker'), name: speakerName };
    map.speakers.push(speaker);
  }

  if (result.owner && !map.owner) {
    map.owner = result.owner;
  }

  // 处理新维度
  if (result.newDimensions) {
    for (const newDim of result.newDimensions) {
      // 检查是否真的不存在同名维度
      const existing = map.dimensions.find(d => d.name === newDim.name);
      if (existing) {
        // 追加证据到已有维度
        const ev = newDim.evidence;
        existing.evidence.push({
          source: ev.source || sourceLabel,
          speaker: ev.speaker || speakerName,
          quote: ev.quote,
          corrected: false,
          interpretation: ev.interpretation,
          date: sourceDate,
        });
        if (newDim.confidence && newDim.confidence !== '不变') {
          existing.confidence = newDim.confidence;
        }
        updates.updatedDims.push({ id: existing.id, name: existing.name, action: '追加证据(匹配到同名)' });
        continue;
      }

      // 确保分类存在
      let category = map.categories.find(c => c.name === newDim.categoryName);
      if (!category && newDim.categoryName) {
        category = { id: nextId('cat'), name: newDim.categoryName, description: newDim.categoryName, icon: newDim.categoryIcon || '📌' };
        map.categories.push(category);
      }

      // 处理 relatedTo - 将名称转为 ID
      const relatedIds = [];
      if (newDim.relatedTo) {
        for (const ref of newDim.relatedTo) {
          const refDim = map.dimensions.find(d => d.id === ref || d.name === ref);
          if (refDim) relatedIds.push(refDim.id);
        }
      }

      const dimId = nextId('dim');
      const dim = {
        id: dimId,
        name: newDim.name,
        status: newDim.status || 'possessed',
        category: category ? category.id : '',
        speakerId: speaker.id,
        description: newDim.description,
    evidence: [{
      source: newDim.evidence.source || sourceLabel,
      speaker: newDim.evidence.speaker || speakerName,
      quote: newDim.evidence.quote,
      corrected: false,
      interpretation: newDim.evidence.interpretation,
      date: sourceDate,
    }],
        relatedTo: relatedIds,
        confidence: newDim.confidence || '弱',
      };

      map.dimensions.push(dim);
      updates.newDims.push({ id: dimId, name: dim.name, status: dim.status });

      // 更新关联维度的 relatedTo
      for (const rid of relatedIds) {
        const refDim = map.dimensions.find(d => d.id === rid);
        if (refDim && !refDim.relatedTo.includes(dimId)) {
          refDim.relatedTo.push(dimId);
        }
      }
    }
  }

  // 处理已更新维度
  if (result.updatedDimensions) {
    for (const upd of result.updatedDimensions) {
      const dim = map.dimensions.find(d => d.id === upd.dimensionId);
      if (!dim) continue;

      if (upd.newEvidence) {
        dim.evidence.push({
          source: upd.newEvidence.source || sourceLabel,
          speaker: upd.newEvidence.speaker || speakerName,
          quote: upd.newEvidence.quote,
          corrected: false,
          interpretation: upd.newEvidence.interpretation,
          date: sourceDate,
        });
      }

      if (upd.confidenceChange && upd.confidenceChange !== '不变') {
        dim.confidence = upd.confidenceChange;
      }

      if (upd.statusChange && upd.statusChange !== '不变') {
        dim.status = upd.statusChange;
      }

      updates.updatedDims.push({ id: dim.id, name: dim.name, action: '更新' });
    }
  }

  // 处理合并建议
  if (result.mergeSuggestions) {
    updates.mergeSuggestions = result.mergeSuggestions;
  }

  // 维护雷达轴
  maintainRadarAxes(map);

  // 记录 sourceLog
  const affectedDimIds = [
    ...updates.newDims.map(d => d.id),
    ...updates.updatedDims.map(d => d.id),
  ];

  map.sourceLog.push({
    date: sourceDate,
    source: sourceLabel,
    speaker: speakerName,
    dimensionsAffected: affectedDimIds,
    summary: result.summary || `本次分析新增${updates.newDims.length}个维度，更新${updates.updatedDims.length}个维度`,
  });

  return updates;
}

/**
 * 维护雷达轴
 */
function maintainRadarAxes(map) {
  const coveredDimIds = new Set();
  for (const axis of map.radarAxes) {
    for (const id of (axis.dimIds || [])) {
      coveredDimIds.add(id);
    }
  }

  // 检查未覆盖的维度
  const uncovered = map.dimensions.filter(d => !coveredDimIds.has(d.id));
  if (uncovered.length === 0) return;

  // 如果有分类，按分类归入雷达轴
  for (const dim of uncovered) {
    let axis = null;
    if (dim.category) {
      axis = map.radarAxes.find(a =>
        a.dimIds && a.dimIds.some(id => {
          const d = map.dimensions.find(dd => dd.id === id);
          return d && d.category === dim.category;
        })
      );
    }
    if (axis) {
      if (!axis.dimIds) axis.dimIds = [];
      axis.dimIds.push(dim.id);
    } else if (map.radarAxes.length < 8) {
      // 创建新轴
      const cat = map.categories.find(c => c.id === dim.category);
      const newAxis = {
        id: nextId('axis'),
        name: cat ? cat.name : dim.name,
        dimIds: [dim.id],
        blindIds: [],
        description: dim.description,
      };
      map.radarAxes.push(newAxis);
    }
  }

  // 如果雷达轴超过8个，合并相近的
  if (map.radarAxes.length > 8) {
    // 简单策略：合并维度最少的轴到最相近的轴
    map.radarAxes.sort((a, b) => (b.dimIds?.length || 0) - (a.dimIds?.length || 0));
    while (map.radarAxes.length > 8) {
      const smallest = map.radarAxes.pop();
      const target = map.radarAxes[map.radarAxes.length - 1];
      target.dimIds = [...(target.dimIds || []), ...(smallest.dimIds || [])];
      target.blindIds = [...(target.blindIds || []), ...(smallest.blindIds || [])];
    }
  }

  // 更新盲区引用
  syncBlindSpotsToRadarAxes(map);
}

module.exports = router;
