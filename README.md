# 成长力场

> 知是行之始，行是知之成。先知己之所能，方知己之所向。

从真实行为中提取能力维度，构建不断生长的能力图谱。独立于 WorkBuddy 运行的本地 Web 应用。

## 快速开始

### 1. 安装依赖

```bash
cd growth-force-field
npm install
```

### 2. 配置 API

复制 `.env.example` 为 `.env`，填入你的 OpenAI 兼容接口配置：

```env
OPENAI_API_KEY=sk-your-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
PORT=3000
```

支持的 OpenAI 兼容接口：
- OpenAI 官方（默认）
- DeepSeek：`https://api.deepseek.com/v1`，模型 `deepseek-chat`
- 月之暗面：`https://api.moonshot.cn/v1`，模型 `moonshot-v1-8k`
- 本地 Ollama：`http://localhost:11434/v1`，模型如 `qwen2.5:14b`（建议 7B 以上）
- 其他兼容接口均可

### 3. 启动服务

```bash
npm start
```

浏览器打开 http://localhost:3000 即可使用。

## 功能

### 分析录音
粘贴录音转写文本，AI 自动提取行为特征和能力维度。支持增量更新——每次新录音都会在已有地图基础上生长。

### 能力图谱
左右分栏展示已具备和待发展维度，按分类折叠聚合。点击维度查看详情、证据链、关联维度。

### 核心组合
识别维度之间的协同关系，命名组合（如"手术刀式管理""温度护城河"），分析适用场景和稀缺性。

### 盲区探测
分析"应该出现但没出现"的能力感知，基于已有维度的触发模式推理盲区。

### 修炼路径
针对待发展维度和盲区，设计可落地的修炼步骤，每步标注利用哪个已具备维度作为杠杆。

### 纠错引用
在维度详情中直接编辑证据引用文本，修正录音转写中的同音字、漏字等错误，修改前原文可追溯还原。

### 雷达图
基于雷达轴数据的多维度可视化，直观展示能力分布。

### 成长时间线
按时间顺序展示认知地图的增长过程，维度标签区分已具备/待发展。

## 开源协议

MIT

所有数据存储在本地 `data/cognition-map.json`，不会上传到任何服务器。

## 技术架构

- **前端**：单 HTML 文件，深色主题，零构建
- **后端**：Node.js + Express
- **AI**：OpenAI 兼容接口（JSON mode）
- **数据**：本地 JSON 文件
