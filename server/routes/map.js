const express = require('express');
const router = express.Router();
const { loadMap, saveMap, createEmptyMap, nextId } = require('../store');

// GET /api/map - 获取地图数据
router.get('/', (req, res) => {
  try {
    const map = loadMap(req.userId);
    res.json(map);
  } catch (e) {
    res.status(500).json({ error: '加载地图数据失败' });
  }
});

// PUT /api/map - 更新地图基本信息
router.put('/', async (req, res) => {
  try {
    const map = loadMap(req.userId);
    const { owner, speakers, categories } = req.body;
    if (owner !== undefined) map.owner = owner;
    if (speakers !== undefined) map.speakers = speakers;
    if (categories !== undefined) map.categories = categories;
    await saveMap(req.userId, map);
    res.json(map);
  } catch (e) {
    res.status(500).json({ error: '更新地图数据失败' });
  }
});

// POST /api/map/reset - 重置地图
router.post('/reset', async (req, res) => {
  try {
    const map = createEmptyMap();
    await saveMap(req.userId, map);
    res.json(map);
  } catch (e) {
    res.status(500).json({ error: '重置数据失败' });
  }
});

// GET /api/map/export - 导出地图 JSON
router.get('/export', (req, res) => {
  try {
    const map = loadMap(req.userId);
    const filename = `growth-force-field-${map.lastUpdated || 'backup'}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.json(map);
  } catch (e) {
    res.status(500).json({ error: '导出失败' });
  }
});

// POST /api/map/import - 导入地图 JSON（合并，不覆盖）
router.post('/import', async (req, res) => {
  try {
    const imported = req.body;
    if (!imported || !Array.isArray(imported.dimensions)) {
      return res.status(400).json({ error: '无效的地图数据格式' });
    }

    const map = loadMap(req.userId);
    const idMap = {}; // old ID → new ID

    // Merge speakers
    for (const sp of (imported.speakers || [])) {
      if (!map.speakers.find(s => s.name === sp.name)) {
        const newId = nextId('speaker');
        idMap[sp.id] = newId;
        map.speakers.push({ ...sp, id: newId });
      }
    }

    // Merge categories
    for (const cat of (imported.categories || [])) {
      if (!map.categories.find(c => c.name === cat.name)) {
        const newId = nextId('cat');
        idMap[cat.id] = newId;
        map.categories.push({ ...cat, id: newId });
      }
    }

    // Merge dimensions (skip duplicates by name, generate new IDs)
    let importedDimCount = 0;
    for (const dim of (imported.dimensions || [])) {
      if (!map.dimensions.find(d => d.name === dim.name)) {
        const newId = nextId('dim');
        idMap[dim.id] = newId;
        // Remap speakerId and category references
        const newDim = { ...dim, id: newId };
        if (dim.speakerId && idMap[dim.speakerId]) newDim.speakerId = idMap[dim.speakerId];
        if (dim.category && idMap[dim.category]) newDim.category = idMap[dim.category];
        // Remap relatedTo
        if (Array.isArray(dim.relatedTo)) {
          newDim.relatedTo = dim.relatedTo.map(rid => idMap[rid] || rid);
        }
        map.dimensions.push(newDim);
        importedDimCount++;
      }
    }

    // Merge sourceLog
    for (const log of (imported.sourceLog || [])) {
      if (!map.sourceLog.find(l => l.source === log.source && l.date === log.date)) {
        const newLog = { ...log };
        if (Array.isArray(log.dimensionsAffected)) {
          newLog.dimensionsAffected = log.dimensionsAffected.map(id => idMap[id] || id);
        }
        map.sourceLog.push(newLog);
      }
    }

    await saveMap(req.userId, map);
    res.json({ success: true, map, importedDimensions: importedDimCount });
  } catch (e) {
    res.status(500).json({ error: '导入失败: ' + e.message });
  }
});

module.exports = router;
