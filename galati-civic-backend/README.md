# Galați Civic Backend

## Smoke validation (minimal, no test framework)

Use this after backend fixes to quickly validate that the API process starts and key public endpoints respond.

### Prerequisites
- Install dependencies once: `npm install`
- Ensure env vars are set (for example via `.env`):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_KEY`)
  - optional `SUPABASE_ISSUES_TABLE`

### Run
```bash
./scripts/smoke-backend.sh
```

### What is validated
1. Backend process starts with `npm start`.
2. `GET /api/health` returns HTTP 200 and JSON with `status: "ok"`.
3. `GET /api/issues` returns HTTP 200 and a JSON array.

### Pass / fail expectations
- **PASS**: Script prints green check lines and ends with `Backend smoke checks passed`.
- **FAIL**: Script exits non-zero and prints response body + backend logs.

### Common failure diagnostics
- Process exits immediately with missing env error: verify Supabase env vars.
- `/api/health` is unreachable: check port collisions (`SMOKE_PORT` can override default `5050`).
- `/api/issues` returns 500/401/403: verify Supabase credentials, table name, and table access policy.

### Useful overrides
- `SMOKE_PORT=5060 ./scripts/smoke-backend.sh`
