# Voltaris AI

**Voltaris AI: An Intelligent Web-Based Three-Phase Electrical Fault Diagnosis and Analysis System**

> Understand Every Fault. Analyse Every Phase.

Software-only academic project for three-phase electrical fault classification using a Random Forest model, FastAPI backend, and React/TypeScript frontend.

---

## Features implemented

- **Fault Lab** — six validated inputs (Ia–Ic, Va–Vc), live illustrative current waveform, prediction, class scores, phase/ground status
- **Original model contract preserved** — same feature order and class labels as PhaseGuard
- **Authentication** — registration, email verification (dev token in console mode), Argon2 password hashing, session cookies, TOTP enrollment/activation APIs, recovery codes, password reset
- **Health & model info** APIs
- **Methodology & Model Insights** pages (honest about reported vs recomputed metrics)
- **Responsive** dark engineering UI (cyan accent on graphite)

## Technology stack

| Layer | Stack |
|-------|--------|
| Frontend | React 18, TypeScript, Vite |
| Backend | FastAPI, Pydantic, SQLAlchemy (async), Alembic-ready |
| Auth | Argon2, pyotp (TOTP), HTTP-only cookies |
| ML | scikit-learn Random Forest (`phaseguard_model.pkl`) |

## Directory structure

```
voltaris-ai/
├── index.html                 # Root entry / redirect
├── README.md
├── .gitignore
├── frontend/                  # Vite React app
│   ├── index.html
│   ├── package.json
│   └── src/
├── backend/
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py
│   │   ├── api/routes/
│   │   ├── ml/
│   │   ├── models/
│   │   └── services/
│   ├── ml_artifacts/
│   │   ├── phaseguard_model.pkl
│   │   └── MODEL_CARD.md
│   ├── data/classData.csv
│   └── tests/
└── docs/
```

## Prerequisites

- Python 3.10+
- Node.js 18+ and npm
- (Optional) PostgreSQL for multi-user production; SQLite used for local demo

## Start the full application (Windows)

Install dependencies once, then use the project launcher whenever you want to
run both the API and web app:

```powershell
cd "D:\major project\Voltaris-AI"
python -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
cd frontend
npm install
cd ..
.\start-kodandapani.ps1
```

The launcher opens the frontend at http://127.0.0.1:5173 and starts the API at
http://127.0.0.1:8000. It uses `backend\.venv` when present, otherwise the
Python available on `PATH`. Keep both service terminal windows open while
using the app; close them to stop the services. If PowerShell blocks local
scripts, allow this script for the current terminal with
`Set-ExecutionPolicy -Scope Process Bypass`.

## Backend setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env if needed (defaults work for local SQLite under /tmp or configured path)

# Run API
$env:PYTHONPATH = "."
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- Health: http://127.0.0.1:8000/api/v1/health  
- OpenAPI docs: http://127.0.0.1:8000/api/docs  
- Predict: `POST /api/v1/predictions`

## Frontend setup

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to the backend.

## Tests

```powershell
cd backend
$env:PYTHONPATH = "."
pytest tests/ -q
```

## Environment variables

See `backend/.env.example`. Important keys:

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Session / general secrets |
| `TOTP_ENCRYPTION_KEY` | Encrypt TOTP secrets at rest |
| `DATABASE_URL` | SQLAlchemy async URL |
| `CORS_ORIGINS` | Allowed frontend origins |
| `MODEL_PATH` | Path to `phaseguard_model.pkl` |
| `EMAIL_PROVIDER` | `console` for local (returns dev tokens) |

## Model & dataset

- Artifact: `backend/ml_artifacts/phaseguard_model.pkl`
- Dataset: `backend/data/classData.csv` (Kaggle Electrical Fault Detection and Classification)
- Do not load untrusted pickle files

## Security notes

- TOTP secrets encrypted at rest
- Recovery codes stored as hashes, single-use
- Passwords hashed with Argon2
- Sessions in HTTP-only cookies (Secure in production)
- Generic auth error messages to limit enumeration
- CORS restricted to configured origins
- Private analysis ownership enforced when history routes are enabled

## Known limitations

- ABC vs ABCG confusion (inherent to feature set)
- Reported 86.3% test accuracy is from the original README until recomputed
- Batch CSV upload and PDF report generation are not fully implemented
- Email delivery requires configuring a real provider for non-dev use

## Attribution

Evolved from [PhaseGuard](https://github.com/Sehrish0508/PhaseGuard). Dataset © Kaggle contributor esathyaprakash.

**Made by VYOMANTTECHNOLOGIES — K Aasritha Vardhan & Team**

---

**Educational use only.** Not a certified protection device.
