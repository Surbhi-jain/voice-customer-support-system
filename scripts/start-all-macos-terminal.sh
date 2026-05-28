#!/usr/bin/env bash
# Open macOS Terminal.app windows for each Voice Support service.
# Usage: npm run start:all:mac

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Escape path for use inside AppleScript single-quoted shell commands.
escape_for_sh() {
  printf '%s' "$1" | sed "s/'/'\\\\''/g"
}

ROOT_ESC="$(escape_for_sh "$ROOT")"

open_terminal() {
  local title="$1"
  local shell_cmd="$2"
  local cmd_esc
  cmd_esc="$(escape_for_sh "$shell_cmd")"

  osascript <<EOF
tell application "Terminal"
  activate
  set newTab to do script "cd '${ROOT_ESC}' && ${cmd_esc}"
  try
    set custom title of newTab to "${title}"
  end try
end tell
EOF
}

echo "Voice Support — opening 4 Terminal windows..."
echo "Repo: $ROOT"
echo ""

if [[ ! -d "$ROOT/node_modules" ]]; then
  echo "Tip: run 'npm install' at repo root first."
  echo ""
fi

if [[ ! -d "$ROOT/services/speech/.venv" ]]; then
  echo "Warning: services/speech/.venv not found."
  echo "  cd services/speech && python3 -m venv .venv && source .venv/bin/activate"
  echo "  pip install -r requirements.txt && python download_models.py"
  echo ""
fi

# 1) Ollama daemon (:11434)
open_terminal "1 Ollama daemon" "npm run ollama:serve"
sleep 0.6

# 2) Ollama chat API (:4000)
open_terminal "2 Ollama API :4000" "npm run dev:ollama"
sleep 0.6

# 3) Speech STT/TTS (:8000)
open_terminal "3 Speech :8000" "cd services/speech && source .venv/bin/activate && uvicorn main:app --host 127.0.0.1 --port 8000"
sleep 0.6

# 4) Web UI (:3000)
open_terminal "4 Web UI :3000" "npm run dev:web"
sleep 0.3

echo "Done. Open http://localhost:3000 in your browser."
echo ""
echo "First time only:"
echo "  npm run ollama:pull          # download LLM model"
echo "  (speech) python download_models.py"
echo ""
echo "All services in one terminal instead: npm run dev  (+ ollama:serve + dev:speech)"
