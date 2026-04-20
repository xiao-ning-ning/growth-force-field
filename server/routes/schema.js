const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const SCHEMA_FILE = path.join(__dirname, '../../data/schema.json');
const DATA_DIR = path.join(__dirname, '../../data');

// 配置 multer：内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Excel 表头字段与 JSON 字段的映射
const FIELD_MAP = {
  '一级分类': 'category',
  '分类': 'category',
  'category': 'category',
  '子维度名称': 'dimension_name',
  '维度名称': 'dimension_name',
  'dimension_name': 'dimension_name',
  '维度定义': 'dimension_desc',
  'definition': 'dimension_desc',
  'dimension_desc': 'dimension_desc',
  '已具备判断标准': 'indicator_possessed',
  'possessed': 'indicator_possessed',
  'indicator_possessed': 'indicator_possessed',
  '待发展判断标准': 'indicator_developing',
  'developing': 'indicator_developing',
  'indicator_developing': 'indicator_developing',
};

// 将 Excel 行映射为 schema 项
function mapRowToSchemaItem(row, headers) {
  const item = {};
  const keys = Object.keys(row);
  for (const key of keys) {
    const normalized = FIELD_MAP[key.trim()] || FIELD_MAP[key];
    if (normalized && row[key] !== undefined && String(row[key]).trim() !== '') {
      item[normalized] = String(row[key]).trim();
    }
  }
  return item;
}

// GET /api/schema - 获取当前 schema 状态
router.get('/', (req, res) => {
  if (!req.userId) return res.status(401).json({ error: '请先登录' });

  const exists = fs.existsSync(SCHEMA_FILE);
  if (!exists) {
    return res.json({ configured: false, message: '未配置自定义能力维度，使用 AI 自由生成' });
  }

  try {
    const schema = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf-8'));
    const stats = {
      configured: true,
      version: schema.version || 1,
      updatedAt: schema.updatedAt,
      categories: schema.categories ? schema.categories.length : 0,
      dimensions: schema.categories
        ? schema.categories.reduce((sum, cat) => sum + (cat.dimensions ? cat.dimensions.length : 0), 0)
        : 0,
    };
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: 'schema 文件损坏: ' + e.message });
  }
});

// GET /api/schema/template - 下载 Excel 模板
router.get('/template', (req, res) => {
  if (!req.userId) return res.status(401).json({ error: '请先登录' });

  // 示例数据行（引导用户填写）
  const sampleData = [
    {
      '一级分类': '战略与诊断',
      '子维度名称': '格局视野',
      '维度定义': '能站在更高维度看问题，看到局部与整体的关系，在复杂局面中判断优先级',
      '已具备判断标准': '能主动跳出当前视角，从上级或全局利益出发分析问题',
      '待发展判断标准': '在被追问时能意识到还有更高视角，但主动调用不足',
    },
    {
      '一级分类': '战略与诊断',
      '子维度名称': '风险预见',
      '维度定义': '能提前识别潜在风险，并准备应对方案，而非等问题爆发才反应',
      '已具备判断标准': '主动提及风险预案，或在问题发生前有预警动作',
      '待发展判断标准': '能事后分析风险原因，但事前预判能力弱',
    },
    {
      '一级分类': '人心与温度',
      '子维度名称': '关系建立',
      '维度定义': '能主动与团队成员建立信任，善于通过日常互动积累影响力',
      '已具备判断标准': '团队成员愿意主动与其交流，有跨部门人脉积累',
      '待发展判断标准': '倾向于就事论事，主动社交行为较少',
    },
  ];

  // 留两行空模板供用户填写
  const emptyTemplate = [
    { '一级分类': '', '子维度名称': '', '维度定义': '', '已具备判断标准': '', '待发展判断标准': '' },
    { '一级分类': '', '子维度名称': '', '维度定义': '', '已具备判断标准': '', '待发展判断标准': '' },
  ];

  const wb = XLSX.utils.book_new();

  // Sheet1：填写说明
  const readmeData = [
    ['成长力场 - 自定义能力维度模板'],
    [],
    ['使用说明'],
    ['1. 每一行填写一个子维度，同一"一级分类"下的维度会自动归类'],
    ['2. 所有字段均为必填，请勿留空'],
    ['3. "维度定义"供 AI 理解该维度的含义，描述越具体分析越准确'],
    ['4. "已具备"和"待发展"标准用于 AI 判断行为属于哪个等级，建议用"能/会..."描述已具备，用"...不足/需要..."描述待发展'],
    ['5. 填写完成后，删除示例行（前三行），保留您自己的数据'],
    ['6. 上传后将覆盖原有的自定义维度配置'],
    [],
    ['示例（请删除以下示例行后上传）'],
  ];
  const readmeSheet = XLSX.utils.aoa_to_sheet(readmeData);
  readmeSheet['!cols'] = [{ wch: 50 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, readmeSheet, '必读说明');

  // Sheet2：维度模板（用户填写区）
  const headerRow = ['一级分类', '子维度名称', '维度定义', '已具备判断标准', '待发展判断标准'];
  const templateSheet = XLSX.utils.aoa_to_sheet([headerRow, ...sampleData, ...emptyTemplate]);
  templateSheet['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 40 },
    { wch: 40 },
    { wch: 40 },
  ];
  // 设置单元格样式提示（表头加粗）
  templateSheet['A1'].s = { font: { bold: true } };
  XLSX.utils.book_append_sheet(wb, templateSheet, '能力维度模板');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.set({
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': 'attachment; filename="成长力场-能力维度模板.xlsx"',
    'Content-Length': buf.length,
  });
  res.send(buf);
});

// POST /api/schema - 上传并解析 Excel schema
router.post('/', upload.single('file'), (req, res) => {
  if (!req.userId) return res.status(401).json({ error: '请先登录' });
  if (!req.file) return res.status(400).json({ error: '请上传 Excel 文件' });

  const filename = req.file.originalname.toLowerCase();
  if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
    return res.status(400).json({ error: '仅支持 .xlsx 或 .xls 格式' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    // 优先读取"能力维度模板" sheet，否则读第一个 sheet
    let sheetName = workbook.SheetNames.find(n => n.includes('模板')) || workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawData.length < 2) {
      return res.status(400).json({ error: '表格数据不足，请确保包含表头和数据行' });
    }

    const headers = rawData[0].map(h => String(h).trim());
    const dataRows = rawData.slice(1);

    // 找必需列的索引
    const requiredCols = ['一级分类', '子维度名称', '维度定义', '已具备判断标准', '待发展判断标准'];
    const foundCols = {};
    for (const col of requiredCols) {
      const idx = headers.findIndex(h => h === col || FIELD_MAP[h] === FIELD_MAP[col]);
      if (idx === -1) {
        return res.status(400).json({ error: `缺少必需列：${col}，请使用模板文件填写` });
      }
      foundCols[col] = idx;
    }

    // 过滤空行并映射
    const items = [];
    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const nameIdx = foundCols['子维度名称'];
      const name = String(row[nameIdx] || '').trim();
      if (!name) continue; // 跳过空行

      const item = {
        id: `dim_${Date.now()}_${i}`,
        dimension_name: name,
        category: String(row[foundCols['一级分类']] || '').trim(),
        dimension_desc: String(row[foundCols['维度定义']] || '').trim(),
        indicator_possessed: String(row[foundCols['已具备判断标准']] || '').trim(),
        indicator_developing: String(row[foundCols['待发展判断标准']] || '').trim(),
      };

      // 必填校验
      if (!item.category) return res.status(400).json({ error: `第 ${i + 2} 行"一级分类"不能为空` });
      if (!item.dimension_desc) return res.status(400).json({ error: `第 ${i + 2} 行"维度定义"不能为空` });
      if (!item.indicator_possessed) return res.status(400).json({ error: `第 ${i + 2} 行"已具备判断标准"不能为空` });
      if (!item.indicator_developing) return res.status(400).json({ error: `第 ${i + 2} 行"待发展判断标准"不能为空` });

      items.push(item);
    }

    if (items.length === 0) {
      return res.status(400).json({ error: '未找到有效数据行，请确保至少填写了一个维度' });
    }

    // 按一级分类聚合
    const categoryMap = {};
    for (const item of items) {
      if (!categoryMap[item.category]) {
        categoryMap[item.category] = { name: item.category, dimensions: [] };
      }
      categoryMap[item.category].dimensions.push({
        id: item.id,
        name: item.dimension_name,
        description: item.dimension_desc,
        indicators: {
          possessed: item.indicator_possessed,
          developing: item.indicator_developing,
        },
      });
    }

    const schema = {
      version: 1,
      source: 'custom',
      uploadedBy: req.userId,
      updatedAt: new Date().toISOString(),
      categories: Object.values(categoryMap),
    };

    // 保存前先备份旧 schema
    if (fs.existsSync(SCHEMA_FILE)) {
      const backupDir = path.join(DATA_DIR, 'schema-backups');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      fs.copyFileSync(SCHEMA_FILE, path.join(backupDir, `schema.${ts}.json`));
    }

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SCHEMA_FILE, JSON.stringify(schema, null, 2), 'utf-8');

    res.json({
      success: true,
      message: `成功导入 ${schema.categories.length} 个分类，共 ${items.length} 个维度`,
      categories: schema.categories.length,
      dimensions: items.length,
    });
  } catch (e) {
    console.error('[schema] 解析失败:', e);
    res.status(500).json({ error: 'Excel 解析失败: ' + e.message });
  }
});

// DELETE /api/schema - 删除自定义 schema，恢复 AI 自由生成
router.delete('/', (req, res) => {
  if (!req.userId) return res.status(401).json({ error: '请先登录' });

  if (!fs.existsSync(SCHEMA_FILE)) {
    return res.status(404).json({ error: '当前未配置自定义维度，无需删除' });
  }

  // 备份后再删
  const backupDir = path.join(DATA_DIR, 'schema-backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  fs.copyFileSync(SCHEMA_FILE, path.join(backupDir, `schema.${ts}.json`));
  fs.unlinkSync(SCHEMA_FILE);

  res.json({ success: true, message: '已删除自定义维度配置，恢复 AI 自由生成模式' });
});

module.exports = router;
