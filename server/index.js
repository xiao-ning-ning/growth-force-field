const express = require('express');
const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    // Skip empty lines and comments
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim();
      if (!process.env[key]) process.env[key] = val;
    }
  });
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '127.0.0.1';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes
// API status check
app.get('/api/status', (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;
  const configured = apiKey && apiKey !== 'sk-your-key-here';
  res.json({
    configured,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  });
});

app.get('/api/open-env', (req, res) => {
  const { exec } = require('child_process');
  const envPath = path.join(__dirname, '..', '.env');
  // Try to open .env with default editor (notepad)
  exec(`notepad "${envPath}"`, (err) => {
    if (err) {
      res.status(500).json({ error: '无法打开配置文件' });
    } else {
      res.json({ success: true });
    }
  });
});

app.use('/api/map', require('./routes/map'));
app.use('/api/analyze', require('./routes/analyze'));
app.use('/api/correct', require('./routes/correct'));
app.use('/api/evidence', require('./routes/evidence'));
app.use('/api/merge', require('./routes/merge'));
app.use('/api/dimensions', require('./routes/dimensions'));
app.use('/api/combinations', require('./routes/combinations'));
app.use('/api/blindspots', require('./routes/blindspots'));
app.use('/api/paths', require('./routes/paths'));

// Global error handler - prevent unhandled errors from crashing the process
app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err);
  res.status(500).json({ error: err.message || '服务器内部错误' });
});

app.listen(PORT, HOST, () => {
  console.log(`\n  成长力场已启动: http://${HOST}:${PORT}\n`);
  // Auto-open browser when launched via bat
  if (process.argv.includes('--open')) {
    const { exec } = require('child_process');
    const url = `http://localhost:${PORT}`;
    exec(`start "" "${url}"`, (err) => {
      if (err) console.log(`  请手动打开浏览器访问: ${url}`);
    });
  }
});
