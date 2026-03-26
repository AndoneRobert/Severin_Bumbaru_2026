#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${FRONTEND_SMOKE_PORT:-4173}"
DEV_URL="http://127.0.0.1:${PORT}"
API_URL="${FRONTEND_API_URL:-http://127.0.0.1:5050/api}"
LOG_FILE="${ROOT_DIR}/.smoke-frontend.log"

cleanup() {
  if [[ -n "${DEV_PID:-}" ]] && kill -0 "${DEV_PID}" 2>/dev/null; then
    kill "${DEV_PID}" 2>/dev/null || true
    wait "${DEV_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT

rm -f "${LOG_FILE}"

(
  cd "${ROOT_DIR}"
  npm run dev -- --host 127.0.0.1 --port "${PORT}" --strictPort >"${LOG_FILE}" 2>&1
) &
DEV_PID=$!

for _ in {1..30}; do
  if curl -fsS "${DEV_URL}" >/dev/null 2>&1; then
    break
  fi

  if ! kill -0 "${DEV_PID}" 2>/dev/null; then
    echo "❌ Frontend dev server stopped before becoming reachable."
    echo "--- frontend log ---"
    cat "${LOG_FILE}" || true
    exit 1
  fi

  sleep 1
done

check_route() {
  local route="$1"
  local output_file="/tmp/frontend-route.html"
  local status

  status="$(curl -sS -o "${output_file}" -w '%{http_code}' "${DEV_URL}${route}")"
  if [[ "${status}" -ne 200 ]]; then
    echo "❌ ${route} returned HTTP ${status}."
    cat "${output_file}" || true
    exit 1
  fi

  if ! rg -q '<div id="root"></div>' "${output_file}"; then
    echo "❌ ${route} did not look like the Vite app shell."
    cat "${output_file}" || true
    exit 1
  fi

  echo "✅ ${route} rendered app shell"
}

check_route "/"
check_route "/dashboard"
check_route "/my-issues"
check_route "/login"
check_route "/admin"

issues_status="$(curl -sS -o /tmp/frontend-issues.json -w '%{http_code}' "${API_URL}/issues" || true)"
if [[ -z "${issues_status}" || "${issues_status}" == "000" ]]; then
  echo "❌ Could not connect to ${API_URL}/issues."
  echo
  echo "Diagnostics: start backend smoke first and ensure FRONTEND_API_URL points at a live /api base URL."
  exit 1
fi

if [[ "${issues_status}" -ne 200 ]]; then
  echo "❌ ${API_URL}/issues returned HTTP ${issues_status}."
  cat /tmp/frontend-issues.json || true
  echo
  echo "Diagnostics: start backend smoke first and ensure FRONTEND_API_URL points at a live /api base URL."
  exit 1
fi

node -e "const fs=require('fs');const data=JSON.parse(fs.readFileSync('/tmp/frontend-issues.json','utf8'));if(!Array.isArray(data)){console.error('issues response is not an array');process.exit(1)}"

echo "✅ ${API_URL}/issues is reachable (same path used by issue list in dev)"
echo "🎉 Frontend smoke checks passed (${DEV_URL})."
