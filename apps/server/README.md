# CV Agent Server

ElysiaJS backend for the CV Agent project.

## Requirements

- Bun 1.3+
- PostgreSQL
- pnpm workspace dependencies

## Environment

```bash
DATABASE_URL="postgres://postgres:postgres@localhost:5432/cv_agent"
ACCESS_TOKEN_SECRET="development-only-change-me"
```

Optional settings:

```bash
HOST="0.0.0.0"
PORT="3000"
CORS_ALLOWED_ORIGINS="http://localhost:5173"
CORS_ALLOWED_ORIGIN_REGEX="^http://(localhost|127\\.0\\.0\\.1):[0-9]+$"
PROFILE_AGENT_MODEL="google_genai:gemini-3-pro-preview"
```

## Database

```bash
pnpm --filter server db:generate
pnpm --filter server db:push
```

## Development

```bash
pnpm --filter server dev
```

Health check:

```text
GET /api/health
```
