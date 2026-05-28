#!/usr/bin/env sh
set -e
cd "$(dirname "$0")/.."
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi
MODEL="${OLLAMA_MODEL:-llama3.2}"
echo "Pulling Ollama model: $MODEL"
ollama pull "$MODEL"
