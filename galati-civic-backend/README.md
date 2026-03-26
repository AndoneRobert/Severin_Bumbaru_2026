# Galați Civic Backend

Backend API (Express + Supabase) for civic issue reporting.

## Tech stack
- Node.js + Express
- Supabase (`@supabase/supabase-js`)
- Token-based auth middleware

## Project structure
- `src/app.js` – app bootstrap, CORS, routes, error handlers
- `src/routes/issues.js` – issue routes
- `src/controllers/issueController.js` – request/response logic
- `src/services/issueService.js` – Supabase table access
- `src/middlewares/auth.js` – auth and role checks
- `supabase/migrations/` – SQL migrations

## Environment variables
Create `.env` in `galati-civic-backend/`:

```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# optional fallback
SUPABASE_KEY=your_supabase_service_role_key

# optional table overrides
SUPABASE_ISSUES_TABLE=issues
SUPABASE_ISSUE_VOTES_TABLE=issues_votes
SUPABASE_ISSUE_COMMENTS_TABLE=issues_comments
SUPABASE_ISSUE_FLAGS_TABLE=issues_flags

# comma-separated origins
CORS_ORIGIN=http://localhost:5173,https://your-frontend-domain
PORT=5050
```

## Run locally
```bash
npm install
npm run dev
# or
npm start
```

Health endpoint:
- `GET /api/health`

## API surface
### Public
- `GET /api/issues` – list issues

### Authenticated
- `GET /api/issues/my`
- `POST /api/issues`
- `PUT /api/issues/:id`
- `DELETE /api/issues/:id`
- `POST /api/issues/:id/vote`
- `POST /api/issues/:id/flag`
- `POST /api/issues/:id/reply` (moderator/admin)
- `PATCH /api/issues/:id/status` (moderator/admin)

## Database planning (Supabase)
Current tables discussed:
- `categories`, `comments`, `issues`, `notifications`, `profiles`
- legacy: `reports`, `report_comments`, `report_votes`

Target model:
- **Canonical main table:** `issues`
- **Canonical support tables:** `issues_comments`, `issues_votes`
- **Canonical moderation tables:** `issues_flags`
- Legacy tables remain only as migration source (to be deprecated)

### Why this refactor
- Keeps naming consistent (`issues_*`)
- Removes confusion between old `reports` and current `issues`
- Makes future joins and policies easier to reason about

### Migration included
This repo now includes:
- `supabase/migrations/20260326_rename_reports_to_issues_support_tables.sql`
- `supabase/migrations/20260326_add_issues_flags_table.sql`

It:
1. Renames `report_comments` -> `issues_comments` and `report_votes` -> `issues_votes` (when present).
2. Creates `issues_comments` and `issues_votes` if missing.
3. Normalizes `report_id` columns to `issue_id`.
4. Adds unique vote constraint `(issue_id, user_id)`.
5. Adds/repairs FK constraints to `issues(id)` and `profiles(id)`.
6. Creates `issues_flags` with unique `(issue_id, user_id)` for moderation reports.

Apply in Supabase SQL editor (or your migration pipeline) before deploying backend changes.

## Voting behavior update
`POST /api/issues/:id/vote` now writes a vote row in `issues_votes` (or legacy fallback `report_votes`) and increments `issues.votes`.
- Duplicate vote from the same user returns HTTP `409`.

## Issue flag behavior update
`POST /api/issues/:id/flag` now writes a moderation flag row in `issues_flags`.
- First flag from a user returns HTTP `201`.
- Duplicate flag attempt from the same user returns HTTP `409`.
- Successful responses include dashboard metadata (`total_flags_for_issue`, `total_flags_by_user`, `latest_flagged_at`).

## Smoke validation (minimal)
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

## Database schema reference (for future AI/dev work)

Use this as a quick reference for table/column names when generating queries, API handlers, or migrations.

| table_name      | column_name | data_type                |
| --------------- | ----------- | ------------------------ |
| categories      | id          | integer                  |
| categories      | name        | character varying        |
| comments        | id          | integer                  |
| comments        | report_id   | integer                  |
| comments        | admin_id    | uuid                     |
| comments        | content     | text                     |
| comments        | is_public   | boolean                  |
| comments        | created_at  | timestamp with time zone |
| issues          | id          | bigint                   |
| issues          | title       | text                     |
| issues          | description | text                     |
| issues          | status      | text                     |
| issues          | latitude    | double precision         |
| issues          | longitude   | double precision         |
| issues          | created_at  | timestamp with time zone |
| issues          | category_id | bigint                   |
| issues          | user_id     | uuid                     |
| issues_comments | id          | uuid                     |
| issues_comments | issue_id    | uuid                     |
| issues_comments | user_id     | uuid                     |
| issues_comments | body        | text                     |
| issues_comments | is_internal | boolean                  |
| issues_comments | created_at  | timestamp with time zone |
| issues_comments | comment     | text                     |
| issues_votes    | user_id     | uuid                     |
| issues_votes    | issue_id    | integer                  |
| issues_votes    | created_at  | timestamp with time zone |
| notifications   | id          | integer                  |
| notifications   | user_id     | uuid                     |
| notifications   | report_id   | integer                  |
| notifications   | type        | text                     |
| notifications   | message     | text                     |
| notifications   | read        | boolean                  |
| notifications   | created_at  | timestamp with time zone |
| profiles        | id          | uuid                     |
| profiles        | full_name   | character varying        |
| profiles        | role        | text                     |
| profiles        | created_at  | timestamp with time zone |
| reports         | id          | integer                  |
| reports         | user_id     | uuid                     |
| reports         | category_id | integer                  |
| reports         | title       | character varying        |
| reports         | description | text                     |
| reports         | address     | character varying        |
| reports         | image_url   | text                     |
| reports         | status      | text                     |
| reports         | created_at  | timestamp with time zone |
| reports         | updated_at  | timestamp with time zone |
| reports         | votes_count | integer                  |
