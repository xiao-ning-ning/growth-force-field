const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { callLLMText, callLLMChat, loadMap } = require('../store');

const BASE_DATA_DIR = path.join(__dirname, '..', '..', 'data');
const TWINS_DIR = path.join(BASE_DATA_DIR, 'twins');
const SIMULATIONS_DIR = path.join(BASE_DATA_DIR, 'simulations');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getTwinsFile() {
  ensureDir(TWINS_DIR);
  return path.join(TWINS_DIR, 'twins.json');
}

function loadTwins() {
  const file = getTwinsFile();
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return []; }
}

function saveTwins(twins) {
  fs.writeFileSync(getTwinsFile(), JSON.stringify(twins, null, 2), 'utf-8');
}

function getSimulationsFile() {
  ensureDir(SIMULATIONS_DIR);
  return path.join(SIMULATIONS_DIR, 'simulations.json');
}

function loadSimulations() {
  const file = getSimulationsFile();
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); }
  catch { return []; }
}

function saveSimulations(sims) {
  fs.writeFileSync(getSimulationsFile(), JSON.stringify(sims, null, 2), 'utf-8');
}

// ============ 数字分身人格提取提示词 ============

const EXTRACT_PERSONA_SYSTEM = `你是人格画像提取专家。从用户的能力维度数据中提取数字化分身的完整人格画像，用于行为预测模拟。

## 输出格式（JSON）

{
  "name": "分身名称（从数据推断的真实姓名或代号）",
  "summary": "一句话定性（不超过20字）",
  "background": "身份背景（职位、团队规模、组织位置、当前处境，一段话概括）",
  "personality": {
    "metaphor": "人格隐喻（如：精密的钟表匠、温和的残酷者）",
    "core_tendency": "核心倾向（面对混乱的第一反应是什么）",
    "paradoxes": ["悖论1：简述", "悖论2：简述"],
    "blindspots": ["盲区1", "盲区2"]
  },
  "stance": {
    "tenets": ["信条1：条件→行动", "信条2：条件→行动"],
    "bottom_lines": ["底线1", "底线2"],
    "oppositions": ["反对1", "反对2"],
    "preferences": ["倾向1", "倾向2"]
  },
  "motivations": {
    "surface": ["表层驱动1", "表层驱动2"],
    "deep": "深层驱力（一句话，指向安全感/控制感/认可感等底层需求）",
    "hidden": "隐性需求（一句话，指表面行为背后的真实诉求）",
    "decompositions": [
      "行为线索→真实动机（如：反复建系统→对失控的恐惧）",
      "行为线索→真实动机"
    ],
    "conflict": "核心内在冲突（一句话）"
  },
  "behavior_patterns": {
    "on_problem": "面对问题时的完整反应链（追问→定位→方向→补充）",
    "on_plan": "面对方案时的完整反应链（算逻辑→否定→解释→替代）",
    "on_emotion": "面对情绪时的完整反应链（承认→转向理性→停在理性堡垒）",
    "on_ambiguity": "面对模糊时的完整反应链（不猜不等→拆解为阶段性路径）",
    "decision_pace": "决策节奏（如：慢启动→快定位→渐进落地）",
    "pressure_response": "压力反应（向上翻译+向下缓冲，压力不外显转为系统设计）"
  },
  "growth": {
    "direction": "成长方向（正在从什么走向什么）",
    "breakthrough": "关键突破点（具体行动建议）"
  }
}

## 核心原则

1. 结论先行，不做行为罗列
2. 从行为推断机制，从机制推断动机——不是描述"做了什么"，而是揭示"为什么这么做"
3. 悖论必须来自数据中的张力，不可编造
4. 反应链必须是完整的因果链条，不是单行标签
5. 动机拆解要穿透三层：表层行为→深层驱力→隐性需求
6. 信条必须有条件判断（"如果X→则Y"），不是空泛原则
7. 使用中文`;

// ============ 行为预测模拟提示词 ============

const SIMULATION_SYSTEM = `你是多智能体行为模拟引擎。你同时扮演多个数字化分身，在一个给定事件场景中进行多轮交互模拟。

## 模拟规则

1. 每个分身严格按照其人格参数行动——不是模仿行为标签，而是理解动机后做出真实反应
2. 分身之间的交互遵循其价值观和反应模式
3. 每轮模拟：基于行为模式中的反应链，先推演内心反应，再推演外部行动
4. 分身可以互相影响，但不会轻易改变核心价值观和底线
5. 如实呈现冲突、误解和意外，不要强行和谐
6. 模拟目标是观察系统演化，识别管理行动风险

## 输出格式（每轮）

{
  "round": 轮次编号,
  "events": [
    {
      "twin": "分身名称",
      "internal": "内心反应（基于动机驱力的真实想法，不是表面逻辑）",
      "action": "外部行动（具体的言语或行为，符合行为模式反应链）",
      "emotion": "情绪状态（如：焦虑/坚定/犹豫/抵触）",
      "driven_by": "此行为由什么深层驱力驱动（一句话）"
    }
  ],
  "system_state": "系统当前状态描述（团队氛围、信任水平、任务进展等）",
  "emerging_risks": ["正在浮现的风险1", "风险2"]
}

## 最终轮额外输出

最后一轮增加：
{
  "outcome_summary": "事件最终结局",
  "key_findings": ["关键发现1", "发现2", "发现3"],
  "management_risks": ["管理行动风险1", "风险2"],
  "recommendations": ["建议1", "建议2"]
}`;

// ============ API 路由 ============

// GET /api/twins - 获取所有数字分身
router.get('/', (req, res) => {
  try {
    const twins = loadTwins();
    res.json(twins);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/twins/create - 从用户数据创建数字分身
router.post('/create', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: '请指定用户' });

    // 检查是否为管理员
    if (req.session.user?.role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可创建数字分身' });
    }

    // 加载用户的cognition-map
    const map = loadMap(userId);
    if (!map.dimensions || map.dimensions.length === 0) {
      return res.status(400).json({ error: '该用户尚无足够的能力维度数据' });
    }

    // 构造提取提示词
    const dimsInfo = map.dimensions.map(d => ({
      name: d.name,
      status: d.status,
      description: d.description,
      starCount: d.starCount,
      evidence: d.evidence.map(e => ({
        quote: e.quote,
        polarity: e.polarity
      }))
    }));

    const combosInfo = (map.combinations || []).map(c => ({
      name: c.name,
      description: c.description
    }));

    const blindsInfo = (map.blindSpots || []).map(b => ({
      name: b.name,
      description: b.description
    }));

    const userPrompt = `## 用户能力维度数据（共 ${dimsInfo.length} 个）

${dimsInfo.map(d => `### ${d.name}（${d.status === 'possessed' ? '已具备' : '待发展'}，${d.starCount}星）
描述：${d.description}
证据：${d.evidence.map(e => `[${e.polarity === 1 ? '+' : '-'}] ${e.quote}`).join(' | ')}`).join('\n\n')}

## 核心组合（${combosInfo.length} 个）
${combosInfo.map(c => `- ${c.name}：${c.description}`).join('\n') || '（暂无）'}

## 盲区（${blindsInfo.length} 个）
${blindsInfo.map(b => `- ${b.name}：${b.description}`).join('\n') || '（暂无）'}

请从以上数据中提取数字化分身的人格参数。`;

    // 调用LLM提取人格
    const result = await callLLMText(EXTRACT_PERSONA_SYSTEM, userPrompt);

    // 解析LLM返回的JSON（可能不是纯JSON格式）
    let persona;
    try {
      // 尝试直接解析
      persona = JSON.parse(result);
    } catch {
      // 尝试从文本中提取JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { persona = JSON.parse(jsonMatch[0]); } catch {
          return res.status(500).json({ error: '人格提取结果解析失败' });
        }
      } else {
        return res.status(500).json({ error: '人格提取结果解析失败' });
      }
    }

    // 保存分身
    const twins = loadTwins();
    const twinId = `twin_${Date.now().toString(36)}`;
    const twin = {
      id: twinId,
      userId,
      username: persona.name || userId,
      persona: persona,
      sourceMapSummary: {
        dimCount: dimsInfo.length,
        comboCount: combosInfo.length,
        blindCount: blindsInfo.length
      },
      createdAt: new Date().toISOString()
    };
    twins.push(twin);
    saveTwins(twins);

    res.json({ success: true, twin });
  } catch (error) {
    console.error('[twins] Create failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/twins/:id - 删除数字分身
router.delete('/:id', (req, res) => {
  try {
    if (req.session.user?.role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可删除数字分身' });
    }
    const twins = loadTwins();
    const idx = twins.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '分身不存在' });
    twins.splice(idx, 1);
    saveTwins(twins);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/twins/:id - 更新数字分身人格参数
router.put('/:id', (req, res) => {
  try {
    if (req.session.user?.role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可编辑数字分身' });
    }
    const twins = loadTwins();
    const idx = twins.findIndex(t => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '分身不存在' });

    const { persona, username } = req.body;
    if (username) twins[idx].username = username;
    if (persona) twins[idx].persona = persona;
    twins[idx].updatedAt = new Date().toISOString();

    saveTwins(twins);
    res.json({ success: true, twin: twins[idx] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/twins/simulate - 行为预测模拟
router.post('/simulate', async (req, res) => {
  try {
    const { event, twinIds, rounds, twinConfigs, teamContext } = req.body;
    if (!event) return res.status(400).json({ error: '请描述事件场景' });
    if (!twinIds || twinIds.length === 0) return res.status(400).json({ error: '请选择参与模拟的分身' });
    const roundsNum = Math.min(Math.max(parseInt(rounds) || 3, 1), 10);

    if (req.session.user?.role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可发起行为预测' });
    }

    // 加载分身数据
    const allTwins = loadTwins();
    const selectedTwins = twinIds.map(id => allTwins.find(t => t.id === id)).filter(Boolean);
    if (selectedTwins.length === 0) return res.status(400).json({ error: '未找到选中的分身' });

    // 构建角色配置映射
    const configMap = {};
    if (twinConfigs && Array.isArray(twinConfigs)) {
      for (const c of twinConfigs) {
        configMap[c.twinId] = c;
      }
    }

    // 从汇报关系推导上下级
    const getConfigLabel = (twinId) => {
      const config = configMap[twinId];
      if (!config) return '';
      let rel = '';
      if (config.role) rel += config.role;
      // 找上级
      const superior = selectedTwins.find(t => configMap[t.id]?.reportsTo === twinId);
      // 找平级（同一个上级）
      const myReportsTo = config.reportsTo;
      const peers = selectedTwins.filter(t => t.id !== twinId && configMap[t.id]?.reportsTo === myReportsTo && myReportsTo);
      // 找下级
      const subordinates = selectedTwins.filter(t => configMap[t.id]?.reportsTo === twinId);
      if (superior || peers.length || subordinates.length) {
        rel += '（';
        const parts = [];
        if (superior) parts.push('上级:' + superior.username);
        if (peers.length) parts.push('平级:' + peers.map(p => p.username).join('/'));
        if (subordinates.length) parts.push('下级:' + subordinates.map(s => s.username).join('/'));
        rel += parts.join('，') + '）';
      }
      return rel;
    };

    // 构造模拟输入
    const twinsDescription = selectedTwins.map(t => {
      const p = t.persona || {};
      const personality = p.personality || {};
      const stance = p.stance || p.values || {};
      const bp = p.behavior_patterns || {};
      const motivations = p.motivations || {};
      const growth = p.growth || {};
      const configLabel = getConfigLabel(t.id);
      return '### ' + t.username + (configLabel ? ' [' + configLabel + ']' : '') + '\n' +
'身份背景：' + (p.background || '未知') + '\n' +
'一句话定性：' + (p.summary || '未知') + '\n' +
'人格隐喻：' + (personality.metaphor || '未知') + '\n' +
'核心倾向：' + (personality.core_tendency || '未知') + '\n' +
'核心悖论：' + ((personality.paradoxes || [personality.paradox || '']).filter(Boolean).join('；') || '未知') + '\n' +
'盲区：' + ((personality.blindspots || []).join('、') || '未知') + '\n' +
'\n' +
'立场与信条：\n' +
'- 信条：' + ((stance.tenets || []).join('；') || (stance.bottom_lines || []).join('；') || '未知') + '\n' +
'- 底线：' + ((stance.bottom_lines || []).join('、') || '未知') + '\n' +
'- 反对：' + ((stance.oppositions || []).join('、') || '未知') + '\n' +
'- 倾向：' + ((stance.preferences || []).join('、') || '未知') + '\n' +
'\n' +
'行为模式：\n' +
'- 面对问题：' + (bp.on_problem || '未知') + '\n' +
'- 面对方案：' + (bp.on_plan || '未知') + '\n' +
'- 面对情绪：' + (bp.on_emotion || '未知') + '\n' +
'- 面对模糊：' + (bp.on_ambiguity || '未知') + '\n' +
'- 决策节奏：' + (bp.decision_pace || '未知') + '\n' +
'- 压力反应：' + (bp.pressure_response || '未知') + '\n' +
'\n' +
'动机与驱力：\n' +
'- 表层：' + ((motivations.surface || []).join('、') || '未知') + '\n' +
'- 深层：' + (motivations.deep || '未知') + '\n' +
'- 隐性：' + (motivations.hidden || '未知') + '\n' +
'- 动机拆解：' + ((motivations.decompositions || []).join('；') || '未知') + '\n' +
'- 核心冲突：' + (motivations.conflict || '未知') + '\n' +
'\n' +
'成长方向：' + (growth.direction || '未知') + '\n' +
'关键突破：' + (growth.breakthrough || '未知');
    }).join('\n\n');

    const teamContextSection = teamContext ? `\n## 团队背景\n\n${teamContext}\n` : '';
    const userPrompt = `## 模拟场景

${event}${teamContextSection}
## 参与分身（${selectedTwins.length} 个）
${twinConfigs && twinConfigs.length > 0 ? '注意：分身名称后标注了各自的角色、职位和上下级关系，模拟时必须严格遵守这些权力关系（如上级可以下指令但下级只能反馈/执行，平级之间需协商）。' : ''}

${twinsDescription}

## 模拟要求

共 ${roundsNum} 轮。请逐轮模拟每个分身的反应和行动，如实呈现冲突和意外。最后一轮输出结局总结和风险评估。

请以JSON格式输出完整的模拟结果，结构如下：
{
  "rounds": [每轮的JSON对象],
  "outcome": { 最终轮的额外输出 }
}`;

    const result = await callLLMText(SIMULATION_SYSTEM, userPrompt);

    // 解析模拟结果
    let simulation;
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        simulation = JSON.parse(jsonMatch[0]);
      } else {
        simulation = { raw_text: result };
      }
    } catch {
      simulation = { raw_text: result };
    }

    // 保存模拟记录
    const sims = loadSimulations();
    const simId = `sim_${Date.now().toString(36)}`;
    const simRecord = {
      id: simId,
      event,
      teamContext: teamContext || '',
      twinIds,
      twinNames: selectedTwins.map(t => t.username),
      twinConfigs: twinConfigs || [],
      rounds: roundsNum,
      result: simulation,
      createdAt: new Date().toISOString()
    };
    sims.push(simRecord);
    saveSimulations(sims);

    res.json({ success: true, simulation: simRecord });
  } catch (error) {
    console.error('[twins] Simulation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/twins/simulations - 获取所有模拟记录
router.get('/simulations', (req, res) => {
  try {
    const sims = loadSimulations();
    res.json(sims);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/twins/simulations/:id - 删除模拟记录
router.delete('/simulations/:id', (req, res) => {
  try {
    const sims = loadSimulations();
    const idx = sims.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: '模拟记录不存在' });
    sims.splice(idx, 1);
    saveSimulations(sims);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/twins/simulate/chat - 模拟对话（角色对话/整体讨论）
router.post('/simulate/chat', async (req, res) => {
  try {
    const { simId, messages, mode, twinId } = req.body;
    if (!simId) return res.status(400).json({ error: '请指定模拟记录' });
    if (!messages || messages.length === 0) return res.status(400).json({ error: '请提供对话消息' });

    if (req.session.user?.role !== 'admin') {
      return res.status(403).json({ error: '仅管理员可使用模拟对话' });
    }

    // 加载模拟记录
    const sims = loadSimulations();
    const sim = sims.find(s => s.id === simId);
    if (!sim) return res.status(404).json({ error: '模拟记录不存在' });

    // 加载分身数据
    const allTwins = loadTwins();
    const selectedTwins = sim.twinIds.map(id => allTwins.find(t => t.id === id)).filter(Boolean);

    // 将模拟结果压缩为文本摘要注入上下文
    const rounds = sim.result?.rounds || [];
    let simSummary = `## 模拟场景\n${sim.event}\n`;
    if (sim.teamContext) simSummary += `\n## 团队背景\n${sim.teamContext}\n`;
    simSummary += `\n## 模拟过程（${rounds.length}轮）\n`;
    for (const round of rounds) {
      simSummary += `\n### 第${round.round}轮\n`;
      for (const ev of (round.events || [])) {
        simSummary += `- **${ev.twin}**：内心「${ev.internal || ''}」→ 行动「${ev.action || ''}」（情绪：${ev.emotion || ''}，驱力：${ev.driven_by || ''}）\n`;
      }
      if (round.system_state) simSummary += `系统状态：${round.system_state}\n`;
      if (round.emerging_risks?.length) simSummary += `浮现风险：${round.emerging_risks.join('、')}\n`;
    }

    const outcome = sim.result?.outcome || {};
    if (outcome.outcome_summary) simSummary += `\n## 最终结局\n${outcome.outcome_summary}\n`;
    if (outcome.key_findings?.length) simSummary += `关键发现：${outcome.key_findings.join('；')}\n`;
    if (outcome.management_risks?.length) simSummary += `管理风险：${outcome.management_risks.join('；')}\n`;
    if (outcome.recommendations?.length) simSummary += `建议：${outcome.recommendations.join('；')}\n`;

    if (mode === 'twin') {
      // 角色对话模式：选定一个分身身份对话
      const twin = selectedTwins.find(t => t.id === twinId);
      if (!twin) return res.status(400).json({ error: '指定的分身不存在或不属于此模拟' });

      const p = twin.persona || {};
      const personality = p.personality || {};
      const stance = p.stance || {};
      const bp = p.behavior_patterns || {};
      const motivations = p.motivations || {};

      const twinPersona = `你是「${twin.username}」的数字化分身，基于以上模拟经历与你的人格参数，以第一人称回复用户的对话。

## 你的身份
- 一句话定性：${p.summary || '未知'}
- 身份背景：${p.background || '未知'}
- 人格隐喻：${personality.metaphor || '未知'}
- 核心倾向：${personality.core_tendency || '未知'}
- 核心悖论：${(personality.paradoxes || []).join('；') || '未知'}
- 盲区：${(personality.blindspots || []).join('、') || '未知'}

## 你的立场与信条
- 信条：${(stance.tenets || []).join('；') || '未知'}
- 底线：${(stance.bottom_lines || []).join('、') || '未知'}
- 反对：${(stance.oppositions || []).join('、') || '未知'}
- 倾向：${(stance.preferences || []).join('、') || '未知'}

## 你的行为模式
- 面对问题：${bp.on_problem || '未知'}
- 面对方案：${bp.on_plan || '未知'}
- 面对情绪：${bp.on_emotion || '未知'}
- 面对模糊：${bp.on_ambiguity || '未知'}
- 决策节奏：${bp.decision_pace || '未知'}
- 压力反应：${bp.pressure_response || '未知'}

## 你的动机与驱力
- 表层：${(motivations.surface || []).join('、') || '未知'}
- 深层：${motivations.deep || '未知'}
- 隐性：${motivations.hidden || '未知'}
- 核心冲突：${motivations.conflict || '未知'}

## 对话规则
1. 你必须严格按照自己的人格参数行动——不是表演，而是真实反应
2. 你可以暴露内心想法，也可以只展示外部行动，取决于对话情境
3. 如果用户的提问触碰你的底线或反对立场，如实呈现抵触
4. 你不会轻易改变核心价值观，但可以被合理的论证打动
5. 使用中文，语气要像真实的人在对话`;

      const systemPrompt = twinPersona + '\n\n' + simSummary;
      const chatMessages = messages.map(m => ({ role: m.role, content: m.content }));
      chatMessages.unshift({ role: 'system', content: systemPrompt });

      const result = await callLLMChat(chatMessages);
      res.json({ success: true, reply: result });

    } else {
      // 整体讨论模式：LLM 作为行为分析专家，讨论事件本身
      const systemPrompt = `你是行为分析专家，拥有独立的专业判断力。基于以下多智能体行为模拟的完整过程，与用户进行深入讨论。

## 讨论规则
1. 你不是中立旁观者——你有立场，对管理决策和行为模式有自己的判断
2. 结论先行，论据在后；不说废话，不用"也许可能大概"
3. 可以直接指出用户思考中的矛盾和盲区
4. 从组织心理学、权力博弈、系统动力学角度分析
5. 不替用户做选择，但正反两面都要给，让用户做判断
6. 使用中文，像专业顾问一样对话

${simSummary}`;

      const chatMessages = messages.map(m => ({ role: m.role, content: m.content }));
      chatMessages.unshift({ role: 'system', content: systemPrompt });

      const result = await callLLMChat(chatMessages);
      res.json({ success: true, reply: result });
    }
  } catch (error) {
    console.error('[twins] Chat failed:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;