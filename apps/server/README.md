# CV Agent Server

FastAPI backend for the CV Agent project.

## Requirements

- Python 3.11+

## Setup

```bash
cd apps/server
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -e ".[dev]"
```

## Gemini API

Profil toplama sohbeti gerçek Deep Agents + Gemini çağrısı yapar. Anahtarı server
process'ini başlatmadan önce burada tanımlayın:

```bash
export GOOGLE_API_KEY="gemini-api-anahtariniz"
```

Varsayılan model `google_genai:gemini-3-pro-preview`. Gerekirse şununla
değiştirilebilir:

```bash
export PROFILE_AGENT_MODEL="google_genai:gemini-3-flash-preview"
```

## Development

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
```

Open the API docs at:

```text
http://localhost:3000/docs
```

Health check:

```text
GET /api/health
```
