# NetSentinel — Campus Router Health 360

NetSentinel is a campus-wide network operations command center and diagnostic engine built for the **Campus Router Health 360** challenge. It implements a structured telemetry-to-diagnosis pipeline:

```text
CSV Telemetry → Health Scoring → Peer Baselines → Temporal Trends → Evidence Strength → Deterministic Recommendations → AI Diagnosis
```

NetSentinel separates raw monitoring telemetry from actual fleet diagnostics, ensuring that IT operators receive highly prioritized, actionable, and 100% data-grounded intervention prescriptions rather than speculative explanations.

---

## 🚀 Key Features

* **Real-time Operations Dashboard**: Provides immediate visibility into campus-wide metrics, including healthy vs. critical counts, status distribution, and worst-performing units.
* **Three-Tier Baseline Profiling**: Contextualizes router telemetry by comparing active metrics against (a) Global baseline, (b) Peer baseline (same location cohort), and (c) Healthy baseline.
* **Temporal Trend Engine**: Analyzes metric logs at 24h, 12h, and 6h ago to map performance trajectories and detect progressive degradation.
* **Unified Evidence Endpoint (`/api/routers/{id}/evidence`)**: Serves as the single source of truth for diagnostics, exposing metrics, baselines, trends, and evidence ratings in a standardized payload.
* **Evidence Strength (Confidence) Matrix**: Computes the severity of anomalies (Strong, Moderate, Weak) based on deviation magnitude relative to healthy baselines.
* **Deterministic Action Prescriptions**: The backend maps telemetry conditions directly to troubleshooting tasks, eliminating arbitrary LLM hallucinations.
* **Intelligent AI Copilot**: A chat workspace capable of answering complex cohort queries (e.g. firmware critical-router rates, building outages, IT priorities) using context-grounded summaries, with a robust fallback generator for offline scenarios.
* **Priority-Based IT Intervention Queue**: Priority scores are computed based on user load and telemetry severity, ensuring IT repairs high-impact nodes first:
  $$\text{Priority Score} = (100 - \text{Health Score}) \times \text{Average Connected Devices} \times \text{Evidence Strength Multiplier}$$

---

## 🛠️ Project Structure

```text
campus-router-health/
├── backend/
│   ├── app/
│   │   ├── api/             # API Endpoints (Dashboard, Routers, Analytics, Copilot)
│   │   ├── services/        # Service Logic (DataLoader, HealthScore, EvidenceEngine, ImpactEngine, Copilot)
│   │   ├── config.py        # Configurable weights, thresholds, and rules
│   │   └── main.py          # Uvicorn FastAPI bootstrapping
│   └── .venv/               # Virtual environment dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # React views (Dashboard, Table, Details, Copilot, FilterBar)
│   │   ├── App.tsx          # Main navigation layout
│   │   ├── index.css        # Global CSS, Tailwind v4, glassmorphism tokens
│   │   └── main.tsx         # App mounting
│   ├── vite.config.ts       # Vite bundler options
│   └── package.json         # Node dependencies
└── README.md                # System documentation
```

---

## 📈 Metric Normalization & Scoring

NetSentinel calculates a **0-100 overall health score** using linear normalization within configurable bounds:

| Telemetry Metric | Ideal Bounds (100 pts) | Critical Bounds (0 pts) | Weight | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **Latency** | $\le 15$ ms | $\ge 100$ ms | 25% | Lower is better |
| **Packet Loss** | $\le 0.2\%$ | $\ge 3.0\%$ | 25% | Lower is better |
| **Disconnects** | $0.0$ / hour | $\ge 2.0$ / hour | 20% | Lower is better |
| **Signal Strength** | $\ge -50$ dBm | $\le -75$ dBm | 10% | Higher is better |
| **Average Speed** | $\ge 60$ Mbps | $\le 15$ Mbps | 10% | Higher is better |
| **Connected Devices**| $\le 15$ devices | $\ge 35$ devices | 10% | Lower is better |

Scores map to status categories: **Healthy** ($\ge 80$), **Watch** ($65-79$), **At Risk** ($50-64$), and **Critical** ($<50$).

---

## ⚙️ Getting Started

### 1. Start the Backend API
From the root directory:
```bash
cd backend
python -m venv .venv
# Activate venv:
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate
pip install -r requirements.txt # (or use uv pip install)
python app/main.py
```
*The backend service will run on `http://localhost:8000`.*

### 2. Start the Frontend Dev Server
From the root directory:
```bash
cd frontend
npm install
npm run dev
```
*The frontend development server will run on `http://localhost:5173`.*

---

## 🧪 Verification & Testing

NetSentinel includes an automated backend validation suite to verify the telemetry parsing, health scoring, peer baselines, and fallback prompt formatting:

```bash
cd backend
python verify_backend.py
```
*This script executes core diagnostics assertions and verifies the fallback structures.*

---

## 🧪 Demo Checklist

1. **Dashboard KPI check**: Verify fleet aggregates (60 total, 52 healthy, 8 critical).
2. **Cohort Filtering**: Select building or firmware from the sidebar and watch charts re-aggregate.
3. **Worst Table Listing**: Sort and select degraded units.
4. **Telemetry detail inspect**: Click R-1042 to view its baseline metrics, 24h trend logs, and sparklines.
5. **Run AI Diagnostics**: Trigger "AI Diagnosis" to receive structured summaries (Diagnosis, Evidence, Contributing Factor, Recommended Action).
6. **Copilot Querying**: Open the chat terminal and submit "Which firmware version has the most unhealthy routers?" to audit v5.1.
7. **IT Priority Audit**: Open the Fleet Analytics view to inspect the prioritized intervention checklist.
