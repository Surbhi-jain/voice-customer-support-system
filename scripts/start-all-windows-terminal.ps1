# Open tabs in Windows Terminal (requires wt.exe on PATH).
# Usage: npm run start:all:win

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

if (-not (Get-Command wt -ErrorAction SilentlyContinue)) {
    Write-Host "Windows Terminal (wt) not found. Install from Microsoft Store or use: npm run start:all:win:cmd"
    exit 1
}

Write-Host "Voice Support — opening Windows Terminal tabs..."
Write-Host "Repo: $Root"

$speechCmd = "cd /d `"$Root\services\speech`" && call .venv\Scripts\activate.bat && uvicorn main:app --host 127.0.0.1 --port 8000"

wt -d $Root cmd /k "title 1 Ollama daemon && npm run ollama:serve" `; `
   new-tab -d $Root cmd /k "title 2 Ollama API :4000 && npm run dev:ollama" `; `
   new-tab -d $Root cmd /k "title 3 Speech :8000 && $speechCmd" `; `
   new-tab -d $Root cmd /k "title 4 Web UI :3000 && npm run dev:web"

Write-Host "Done. Open http://localhost:3000"
