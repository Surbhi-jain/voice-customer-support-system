#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi
BASE="${OLLAMA_BASE_URL:-http://localhost:11434}"
echo "Checking Ollama daemon at $BASE"
curl -sf "$BASE/api/version" >/dev/null && echo "OK" || {
  echo "Ollama daemon not reachable. Run: npm run daemon:serve"
  exit 1
}
