# GrowthLens

### AI-Powered Capability Analysis & Behavioral Simulation for Managers

> "Action is the starting point of knowledge; knowledge is the completion of action. Know your capabilities first, and you will know your direction."

**Turn managers' soft skills from "gut feel" into evidence; turn team decision risks from guesswork into simulation.**

Upload a meeting transcript → AI analyzes behavioral patterns → Quantifies capability dimensions → Designs actionable growth paths → Creates digital twins → Simulates team interaction risks.

Open-source & free · Local data storage · No registration required

[![License](https://img.shields.io/badge/license-Apache%202.0-blue)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

> 中文 README：[README.md](README.md)

---

## What Problem Does It Solve?

Three common dilemmas managers face:

| Scenario | Pain Point |
|:---------|:-----------|
| Performance Review | Your direct report wrote 20 slides. Which are genuine capabilities and which are just rehearsed talking points? |
| Promotion Decisions | Scoring based on impressions — who's stronger in soft skills? Can't articulate why. |
| Team Decisions | Rolling out a new process — how will the team react? Who resists, who adapts first? Nobody knows. |

**GrowthLens's approach**: Soft skills aren't assessed by asking — they're inferred by observing behavior. What you do and say is more truthful than what you claim about yourself. Go further — when you turn behavioral patterns into parameterizable digital twins, you can see how your team might react before making real decisions.

---

## Core Features

### 1. AI Behavioral Analysis
Identify real behavioral patterns from meeting notes, self-assessments, and interview transcripts. Quantify possessed, developing, and blind-spot dimensions. Every conclusion includes **original quotes** — traceable and auditable.

**Star Rating**: Each piece of evidence is rated +1 (positive) or -1 (negative). Stars accumulate to determine capability status — positive → Possessed, negative → Developing, zero → Dimension removed. Dynamic, bidirectional flow.

**Transcript Preprocessing**: Automatically corrects ASR errors, removes filler words, and fixes sentence boundaries before analysis — significantly improving evidence readability.

**Evidence Editing**: Manually correct evidence quote text (original quote preserved for revert), giving fine control over star direction.

### 2. Capability Map
Five-dimension overview (Strategy & Diagnosis, Control & Performance, Heart & Warmth, Knowledge & Empowerment, System & Design) showing the full capability landscape and relationships between dimensions.

### 3. Core Combinations
Bundle related capability fragments into a single explainable whole. Know how they work together, where you're strongest, and when to apply them.

### 4. Blind Spot Detection
AI infers capabilities you "should have but aren't aware of" based on behavioral patterns — not extracted directly from transcripts, but identified through cross-dimensional comparison and scenario coverage analysis.

### 5. Growth Paths
For each developing dimension or blind spot, AI designs concrete action steps — each annotated with which existing capability to leverage as a fulcrum.

Minimum change, maximum leverage. No need to rebuild from scratch.

### 6. Growth Trajectory
Five-dimension line chart tracking capability growth over time. Admins can compare multiple users' curves. Hover over any data point to see detailed breakdown.

### 7. Deep Thinking
Cognitive-level depth audit based on existing capability data. Three-column layout: left for analysis reports, center for conversation, right for notes notebook.

**Deep Analysis Reports**:
- Paradox-driven framework (default) and convergence framework (special case) auto-switch
- Cognitive anchor → Paradox chain → Invisible structures & risks → Action & inquiry
- Accompanied by an "accessible version" (one-line summary + concrete analogy + action highlights)
- Report declaration (specifies concrete limitations of this analysis, no vague platitudes)

**Conversation Module**: AI acts as a professional advisor (with judgment, willing to challenge, no pleasantries). Multi-turn dialogue with analysis context injected.

**Notes Notebook**: Supports Markdown rendering and editing (format toolbar), auto-persisted in real-time.

### 8. Digital Twins (Admin)
From a user's capability dimension data, AI automatically extracts a complete persona portrait — including background, personality metaphor, core tendencies, paradoxes, blind spots, stance/tenets, behavioral reaction chains, three-layer motivation penetration, and growth direction. All parameters are manually editable for fine-tuning.

### 9. Behavioral Prediction Simulation (Admin)
Select multiple digital twins, define an event scenario with role configurations (including reporting relationships), and run multi-round interaction simulations.

- Each round outputs every twin's internal reaction, external action, emotion, and driving force
- System state and emerging risks
- Final round outputs outcome summary, key findings, management risks, and recommendations
- Simulation chat: converse with a twin in first-person, or discuss results with a behavioral analysis expert

### 10. Custom Capability Dimensions (Admin)
Upload an Excel file to define your own dimension framework (category, dimension name, definition, possessed/developing judgment criteria). AI analyzes strictly against your definitions, unconstrained by generic models. Delete anytime to restore AI free-generation mode.

### 11. Team Management View (Admin)
Admin tools contain three sub-tabs:
- **Team Dashboard**: Heatmap overview of team capability distribution, multi-user comparison charts
- **Digital Twins**: Create, view details, edit, delete twins
- **Behavioral Prediction**: Launch simulations, view simulation history, simulation chat

---

## Differentiation

| Dimension | GrowthLens | Traditional Assessment | Online AI Platforms |
|:----------|:------------------|:--------------------|:-------------------|
| Evidence Chain | **Original quotes for every conclusion** | None | None |
| Data Storage | **Local**, stays within your company | Cloud or paper | Cloud |
| Continuous Growth | **Incremental accumulation** | One-time | One-time |
| Multi-user Management | **Supported** — admin views all team members | Not supported | Not supported |
| Behavioral Simulation | **Digital twins + multi-agent simulation** | None | None |
| Cognitive Depth | **Paradox-driven framework + accessible version** | Generic scoring | Generic scoring |

---

## Quick Start

### Prerequisites

| Dependency | Notes |
|:-----------|:------|
| **Node.js** | Download from [nodejs.org](https://nodejs.org) (LTS); Windows: `winget install OpenJS.NodeJS.LTS`; macOS: `brew install node` |
| **.env config** | Auto-generated on first launch — no manual setup needed |

> `start.bat` automatically checks for `node_modules`. If missing, it runs `npm install` for you. `git clone` includes `node_modules`; ZIP downloads don't, but `start.bat` handles it automatically.

### Launch

**Windows**:
```bash
git clone https://github.com/xiao-ning-ning/growth-lens.git
cd growth-lens
start.bat
```

**macOS / Linux**:
```bash
git clone https://github.com/xiao-ning-ning/growth-lens.git
cd growth-lens
chmod +x start.sh && ./start.sh
```

> Automatically detects port occupancy, kills stale processes, starts the server, and opens your browser.

### Configuration (Optional)

Create/edit `.env` in the project root:

```env
OPENAI_API_KEY=sk-your-api-key        # Required, AI API key
OPENAI_BASE_URL=https://api.deepseek.com  # Optional, default OpenAI official
OPENAI_MODEL=deepseek-chat            # Optional, default gpt-4o
OPENAI_TIMEOUT=300000                 # Optional, default 5 min (ms)
ADMIN_USERNAME=admin                   # Optional, default admin
ADMIN_PASSWORD=your-password           # Optional, default admin123456
SESSION_SECRET=                        # Optional, auto-generated on first launch
PORT=3000                              # Optional, default 3000
HOST=0.0.0.0                           # Optional, default 0.0.0.0
```

**Recommended model**: **DeepSeek** (best cost-performance, excellent Chinese understanding, stable JSON output). Supports OpenAI / DeepSeek / Moonshot / local Ollama (any OpenAI-compatible API). Reasoning models (DeepSeek-R1, MiniMax, etc.) automatically strip their thinking process.

---

## License

[Apache 2.0](LICENSE)