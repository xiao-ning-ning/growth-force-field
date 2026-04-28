# GrowthLens

### AI-Powered Capability Analysis & Behavioral Simulation for Managers

> "Action is the starting point of knowledge; knowledge is the completion of action. Know your capabilities first, and you will know your direction."

**Turn managers' soft skills from "gut feel" into evidence — and let AI simulate how your team will react before you make the call.**

Upload a meeting transcript → AI analyzes behavioral patterns → Quantifies capability dimensions → Designs actionable growth paths → Creates digital twins to simulate team dynamics.

Open-source & free · Local data storage · No registration required · Multi-user support

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
| Organizational Change | Rolling out a new process or reassigning leadership — how will the team actually react? Who resists, who bolts? |

**GrowthLens's approach**: Soft skills aren't assessed by asking — they're inferred by observing behavior. What you do and say is more truthful than what you claim about yourself. Go further — parameterize those behavioral patterns into digital twins, and you can see how your team might react before making real decisions.

---

## Core Features

### 1. AI Behavioral Analysis
Identify real behavioral patterns from meeting notes, self-assessments, and interview transcripts. Quantify possessed, developing, and blind-spot dimensions. Every conclusion includes **original quotes** — traceable and auditable.

**Star Rating**: Each piece of evidence is rated +1 (positive) or -1 (negative). Stars accumulate to determine capability status — positive → Possessed, negative → Developing, zero → Dimension removed. Dynamic, bidirectional flow.

**Transcript Preprocessing**: Automatically corrects ASR errors, removes filler words, and fixes sentence boundaries before analysis — significantly improving evidence readability.

**Evidence Editing**: Manually correct evidence quotes (original preserved for revert), giving fine control over star direction.

### 2. Capability Map
Five-dimension overview showing the full capability landscape and relationships. Supports expand/collapse, batch deletion, and dimension merging.

### 3. Core Combinations
Bundle related capability fragments into a single explainable whole. Know how they work together, where you're strongest, and when to apply them. Dynamic threshold — only dimensions above the evidence count percentile qualify, preventing weak dimensions from polluting combinations.

### 4. Blind Spot Detection
AI infers capabilities you "should have but aren't aware of" based on behavioral patterns — not extracted directly from transcripts, but identified through cross-dimensional comparison and scenario coverage analysis.

### 5. Growth Paths
For each developing dimension or blind spot, AI designs concrete action steps — each annotated with which existing capability to leverage as a fulcrum. Supports step completion checkboxes and path completion marking.

Minimum change, maximum leverage. No need to rebuild from scratch.

### 6. Growth Trajectory
Five-dimension line chart tracking capability growth over time. Admins can compare multiple users' curves. Hover over any data point to see detailed breakdown.

### 7. Deep Thinking
Cognitive-level depth audit based on existing capability data.

**Deep Analysis Report**: Paradox-driven framework (default) and convergence framework (special case) auto-switch. Paradox type outputs cognitive anchor → paradox chain → invisible structures & risks → action & inquiry. Convergence type outputs core thesis → evidence chain → action plan. All reports include an **accessible version** (one-line summary + concrete analogy + action highlights) and a **declaration** (specifying concrete limitations of this analysis).

**Conversation Module**: AI as a professional advisor (with judgment, willing to challenge, no pleasantries). Multi-turn dialogue on real issues, with analysis context injection.

**Notes Notebook**: Real-time thought capture, Markdown rendering with formatting toolbar, auto-persisted.

### 8. Custom Capability Dimensions (Admin)
Upload an Excel file to define your own dimension framework (category, dimension name, definition, possessed/developing judgment criteria). AI analyzes strictly against your definitions, unconstrained by generic models. Delete anytime to restore AI free-generation mode; old schemas auto-backed up before replacement.

### 9. Digital Twins (Admin)
From a user's capability dimension data, AI automatically extracts a complete persona portrait — one-line characterization, personality metaphor, core tendencies & paradoxes, stance tenets & bottom lines, full behavioral reaction chains (on problem/plan/emotion/ambiguity), three-layer motivation penetration (surface → deep → hidden), growth direction & breakthrough points.

All persona parameters are manually editable for fine-tuning, ensuring the twin reflects your real understanding of this person.

### 10. Behavioral Prediction Simulation (Admin)
Select multiple digital twins, define an event scenario with role configurations (position, reporting relationships), and AI runs multi-round interaction simulations.

Each round outputs every twin's internal reaction, external action, emotional state, and deep driving force, plus system state and emerging risks. The final round adds outcome summary, key findings, management risks, and recommendations.

**Simulation Chat**: Two modes — character dialogue (first-person conversation with a selected twin) and holistic discussion (discuss simulation results with a behavioral analysis expert).

### 11. Team Management View (Admin)
Admin tools contain three sub-tabs:
- **Team Dashboard**: Heatmap overview of team capability distribution, multi-user comparison charts, growth record management
- **Digital Twins**: Twin list, create, view details, edit, delete
- **Behavioral Prediction**: Launch simulations, view history, simulation chat

---

## Additional Capabilities

| Feature | Description |
|:--------|:------------|
| Multi-user Authentication | Login system; admin can create/delete/reset regular users; data isolated per user |
| Data Import/Export | Export full map as JSON; import merges (deduplicates dimensions, remaps IDs) rather than overwrites |
| Reasoning Model Compatibility | DeepSeek-R1, MiniMax thinking process auto-stripped (`<think>` tag handling) |
| Data Safety | Auto-backup before write, auto-recovery from corrupted files, per-user write lock for concurrency |
| Project Pitch Deck | `pitch.html` slide-style project introduction, suitable for internal presentations |

---

## Differentiation

| Dimension | GrowthLens | Traditional Assessment | Online AI Platforms |
|:----------|:------------------|:--------------------|:-------------------|
| Evidence Chain | **Original quotes for every conclusion** | None | None |
| Data Storage | **Local**, stays within your company | Cloud or paper | Cloud |
| Continuous Growth | **Incremental accumulation** | One-time | One-time |
| Multi-user Management | **Supported** — admin views all team members | Not supported | Not supported |
| Behavioral Simulation | **Digital twins + multi-agent simulation** | None | None |
| Cognitive Depth | **Paradox-driven audit + accessible version** | Rating scales | Generic commentary |

---

## Quick Start

### Prerequisites

| Dependency | Notes |
|:-----------|:------|
| **Node.js ≥ 18** | Download from [nodejs.org](https://nodejs.org) (LTS); Windows: `winget install OpenJS.NodeJS.LTS`; macOS: `brew install node` |
| **AI API Key** | Any OpenAI-compatible API key required (DeepSeek recommended) |
| **.env config** | Auto-generated on first launch — just fill in your API key |

> `start.bat` automatically checks for `node_modules`. If missing, it runs `npm install` for you. `git clone` includes `node_modules`; ZIP downloads don't, but `start.bat` handles it automatically.

Default login on first run: `admin / admin123456` — change the password immediately after login.

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

### Configuration

Create/edit `.env` in the project root:

```env
OPENAI_API_KEY=sk-your-api-key
OPENAI_BASE_URL=https://api.deepseek.com     # Optional, default OpenAI official
OPENAI_MODEL=deepseek-chat                    # Optional, default gpt-4o
OPENAI_TIMEOUT=300000                         # Optional, default 5 minutes (ms)
```

**Recommended model**: **DeepSeek** (best cost-performance, excellent Chinese understanding, stable JSON output). Supports OpenAI / DeepSeek / Moonshot / MiniMax / local Ollama (any OpenAI-compatible API). Reasoning models (DeepSeek-R1) automatically strip their thinking process.

---

## License

[Apache 2.0](LICENSE)