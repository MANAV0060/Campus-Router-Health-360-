import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  INITIAL_ROUTERS,
  generateDashboardData,
  getRouterEvidence,
  getAnalyticsData
} from './src/mockData.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// CORS headers if needed
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-memory router dataset state for interactive actions
let routerState = [...INITIAL_ROUTERS];

// API Routes
app.get('/api/dashboard', (req, res) => {
  const { building, firmware, model, status } = req.query as Record<string, string>;
  const data = generateDashboardData(routerState, building, firmware, model, status);
  res.json(data);
});

app.get('/api/routers', (req, res) => {
  const { building, firmware, model, status, search } = req.query as Record<string, string>;
  let result = [...routerState];

  if (building && building !== 'All') {
    result = result.filter(r => r.building === building);
  }
  if (firmware && firmware !== 'All') {
    result = result.filter(r => r.firmware === firmware);
  }
  if (model && model !== 'All') {
    result = result.filter(r => r.model === model);
  }
  if (status && status !== 'All') {
    result = result.filter(r => r.status === status);
  }
  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    result = result.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.building.toLowerCase().includes(q) ||
      r.room.toLowerCase().includes(q) ||
      r.ip.toLowerCase().includes(q) ||
      r.model.toLowerCase().includes(q)
    );
  }

  res.json(result);
});

app.get('/api/routers/:id/evidence', (req, res) => {
  const routerId = req.params.id;
  const evidenceData = getRouterEvidence(routerId, routerState);
  res.json(evidenceData);
});

app.get('/api/analytics', (req, res) => {
  const analyticsData = getAnalyticsData(routerState);
  res.json(analyticsData);
});

app.post('/api/copilot', async (req, res) => {
  const { question } = req.body || {};

  if (!question) {
    return res.status(400).json({ error: 'Question payload is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const criticalCount = routerState.filter(r => r.status === 'Critical').length;
      const watchCount = routerState.filter(r => r.status === 'Watch').length;

      const systemContext = `You are NetSentinel Copilot, an elite AI Campus Network Diagnostics & Telemetry Engineer for university IT operations.
You have real-time access to the campus router fleet state:
- Total Routers: ${routerState.length}
- Critical Routers: ${criticalCount} (e.g. RTR-ENG-301 in Engineering Center with 184ms latency & 12.8% packet loss, RTR-SCI-104 in Science Hall, RTR-MED-210 in Medical Center)
- Watch Routers: ${watchCount}
- Top Risk Buildings: Engineering Center, Science Hall, Medical Research Center

Provide direct, actionable, professional markdown answers detailing diagnostics, firmware vulnerabilities, traffic shaping recommendations, baseline deviations, and step-by-step IT technician dispatch steps. Keep code/cli snippets clean (e.g. Cisco IOS/Junos commands).`;

      const geminiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: question,
        config: {
          systemInstruction: systemContext,
          temperature: 0.3
        }
      });

      const text = geminiRes.text || "NetSentinel Copilot analyzed your request.";
      return res.json({
        response: text,
        source: 'NetSentinel AI Copilot (Gemini 2.5 Flash)'
      });
    } catch (err) {
      console.error('Gemini API Error, falling back to smart engine:', err);
    }
  }

  // Contextual fallback response generator when Gemini key is not configured or fails
  const qLower = question.toLowerCase();
  let responseText = '';

  if (qLower.includes('critical') || qLower.includes('worst') || qLower.includes('eng-301')) {
    responseText = `### 🚨 Critical Router Analysis: **RTR-ENG-301**
**Location:** Engineering Center (301 North Lab)  
**Status:** Critical | **Priority Score:** 94 / 100 | **Affected Users:** 342  

#### **Root Cause Diagnostics:**
1. **Packet Loss Spike (12.8%):** Buffer overrun on trunk port \`ge-0/0/1\` caused by deprecated firmware ARP table memory leak.
2. **Latency Deviation (+1316%):** Current latency is **184 ms** vs **12 ms** healthy benchmark.
3. **24h Interface Drops:** 38 disconnect flap events recorded.

#### **Recommended Mitigation:**
\`\`\`bash
# 1. Connect via SSH to Management Interface
ssh admin@10.240.12.45

# 2. Clear ARP buffer & re-allocate queue memory
clear ip arp buffer
configure terminal
 interface ge-0/0/1
  hold-queue 4096 in
  hold-queue 4096 out

# 3. Schedule Firmware Update
boot system flash:v4.14.2-LTS.bin
reload at 02:00
\`\`\`
*Dispatch Tier-3 Technician Alex Vance with replacement SFP module.*`;
  } else if (qLower.includes('firmware') || qLower.includes('outdated') || qLower.includes('update')) {
    responseText = `### 📦 Campus Firmware Inventory & Security Audit
Currently **3 routers** are running vulnerable or deprecated firmware:

1. **v3.9.4-VULN (2 Nodes):**  
   - \`RTR-SCI-104\` (Science Hall) — Vulnerable to CVE-2024-3891 ARP Overflow.
   - \`RTR-ATH-101\` (Athletics Complex) — Vulnerable to buffer exhaustion under high UDP broadcast.
2. **v4.10.0-DEPR (2 Nodes):**  
   - \`RTR-LIB-202\` (Library Annex) & \`RTR-ENG-102\` (Engineering South).

#### **Action Plan:**
- **Recommended Version:** \`v4.14.2-LTS\` (Stable, Zero known memory leaks).
- **Estimated Batch Flash Time:** 12 minutes.
- **Expected Bandwidth Recovery:** +450 Mbps.`;
  } else if (qLower.includes('building') || qLower.includes('engineering') || qLower.includes('science')) {
    responseText = `### 🏢 Campus Building Health Overview

- **Engineering Center:** Highest risk score (**152 pts** combined). 1 Critical node (\`RTR-ENG-301\`) and 1 Watch node (\`RTR-ENG-102\`). **482 total users impacted**.
- **Science Hall:** High risk (**89 pts**). 1 Critical node (\`RTR-SCI-104\`) with 9.4% packet loss.
- **Medical Research Center:** Critical node (\`RTR-MED-210\`) in Cryo Core with 210ms latency.
- **Admin East & Tech Tower:** Operating at **100% nominal health** (<12ms latency, 0% packet loss).`;
  } else {
    responseText = `### 📡 NetSentinel Diagnostics Summary
I've analyzed the current campus network telemetry:

- **Fleet Health Score:** **68 / 100**
- **Active Anomalies:** 3 Critical, 4 Watch, 5 Healthy routers.
- **Primary Bottleneck:** High round-trip latency (avg 184ms) and packet loss (12.8%) on **RTR-ENG-301** impacting 342 students in Engineering Center.

#### Suggested Queries:
1. *"Explain the root cause for RTR-ENG-301"*
2. *"List all routers running outdated firmware"*
3. *"Which buildings have the highest user impact?"*
4. *"Generate technician dispatch checklist for Science Hall"*`;
  }

  return res.json({
    response: responseText,
    source: 'NetSentinel AI Copilot (Built-in Knowledge Engine)'
  });
});

// Setup Vite or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NetSentinel] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
