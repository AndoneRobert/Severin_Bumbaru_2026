# Code Review Findings

Date: 2026-03-26
Reviewer: Codex

## Summary

I reviewed the backend and frontend source for functional correctness, API contract alignment, and build/lint readiness.

## Findings

### 1) Backend module imports point to files that do not exist (Critical)
- `src/app.js` imports `./routes/issuesRoutes`, `./routes/tablesRoutes`, `./services/issuesService`, and `./services/tablesService`.
- In this repository, only `src/routes/issues.js` and `src/services/issueService.js` exist.
- Impact: backend cannot boot once dependencies are installed because required modules are unresolved.

### 2) Route handlers reference controller functions that are not exported (Critical)
- `src/routes/issues.js` uses `issueController.getIssues` and `issueController.updateIssueStatus`.
- `src/controllers/issueController.js` exports `listIssues` and `updateIssue` (different names), so router handlers are `undefined`.
- Impact: Express route registration/runtime failures and inaccessible endpoints.

### 3) Frontend and backend API contracts are incompatible (High)
- Frontend calls endpoints like `/issues`, `/issues/my`, `PUT /issues/:id`, `DELETE /issues/:id`, `POST /issues/:id/vote`, `POST /issues/:id/flag`, `POST /issues/:id/reply`.
- Backend routes currently expose only `GET /`, `POST /`, and `PATCH /:id/status` on the issues router.
- Impact: most frontend actions (my issues, edit, delete, vote, flag, reply) fail against current backend.

### 4) Frontend has blocking compile/lint errors from undefined symbols (High)
- `Home.jsx` references undefined identifiers (`m`, `apiUrl`, `flagIssue`, `updateIssue`, `replyIssue`) and has many `no-undef` failures.
- `CreateIssueContainer.jsx` passes `MapPicker` but no such symbol is defined.
- Impact: frontend fails lint/build quality gates and is likely broken at runtime in key pages.

### 5) CORS defaults to allow-all when `CORS_ORIGIN` is unset (Medium)
- In `src/app.js`, when `CORS_ORIGIN` is empty, all origins are allowed.
- Impact: accidental permissive CORS in production if env var is omitted.

## Validation commands executed
- `npm --prefix galati-civic-frontend run lint` (fails with 255 errors / 1 warning)

