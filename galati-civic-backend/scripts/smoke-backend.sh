#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${SMOKE_PORT:-5050}"
BASE_URL="http://127.0.0.1:${PORT}"
LOG_FILE="${ROOT_DIR}/.smoke-backend.log"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "${SERVER_PID}" 2>/dev/null; then
    kill "${SERVER_PID}" 2>/dev/null || true
    wait "${SERVER_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

rm -f "${LOG_FILE}"

(
  cd "${ROOT_DIR}"
  PORT="${PORT}" npm start >"${LOG_FILE}" 2>&1
) &
SERVER_PID=$!

for _ in {1..30}; do
  if curl -fsS "${BASE_URL}/api/health" >/dev/null 2>&1; then
    break
  fi

  if ! kill -0 "${SERVER_PID}" 2>/dev/null; then
    echo "❌ Backend process stopped before /api/health became reachable."
    echo "--- backend log ---"
    cat "${LOG_FILE}" || true
    exit 1
  fi

  sleep 1
done

if ! curl -fsS "${BASE_URL}/api/health" >/tmp/backend-health.json; then
  echo "❌ /api/health did not respond with 2xx."
  echo "--- backend log ---"
  cat "${LOG_FILE}" || true
  exit 1
fi

node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync('/tmp/backend-health.json','utf8'));if(data.status!=='ok'){console.error('status was not ok');process.exit(1)}"

echo "✅ /api/health returned status=ok"

issues_status="$(curl -sS -o /tmp/backend-issues.json -w '%{http_code}' "${BASE_URL}/api/issues")"
if [[ "${issues_status}" -ne 200 ]]; then
  echo "❌ /api/issues returned HTTP ${issues_status}."
  echo "Response body:"
  cat /tmp/backend-issues.json || true
  echo
  echo "--- backend log ---"
  cat "${LOG_FILE}" || true
  echo
  echo "Diagnostics: verify SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY/SUPABASE_KEY and SUPABASE_ISSUES_TABLE in backend env."
  exit 1
fi

node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync('/tmp/backend-issues.json','utf8'));if(!Array.isArray(data)){console.error('/api/issues did not return an array');process.exit(1)}"

echo "✅ /api/issues returned JSON array"
echo "🎉 Backend smoke checks passed (${BASE_URL})."
