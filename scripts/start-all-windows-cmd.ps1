# Open separate Command Prompt (cmd) windows for each Voice Support service.
# Usage: npm run start:all:win:cmd

$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

function Start-ServiceWindow {
    param(
        [string]$Title,
        [string]$Command
    )

    $fullCmd = "cd /d `"$Root`" && title $Title && $Command"
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k", $fullCmd -WindowStyle Normal
    Write-Host "Opened: $Title"
    Start-Sleep -Milliseconds 600
}

Write-Host "Voice Support — opening 4 Command Prompt windows..."
Write-Host "Repo: $Root"
Write-Host ""

if (-not (Test-Path "$Root\node_modules")) {
    Write-Host "Tip: run 'npm install' at repo root first."
    Write-Host ""
}

$venvActivate = "$Root\services\speech\.venv\Scripts\activate.bat"
if (-not (Test-Path $venvActivate)) {
    Write-Host "Warning: services\speech\.venv not found."
    Write-Host "  cd services\speech"
    Write-Host "  python -m venv .venv"
    Write-Host "  .venv\Scripts\activate"
    Write-Host "  pip install -r requirements.txt"
    Write-Host "  python download_models.py"
    Write-Host ""
}

# 1) Ollama daemon (:11434)
Start-ServiceWindow "1 Ollama daemon" "npm run ollama:serve"

# 2) Ollama chat API (:4000)
Start-ServiceWindow "2 Ollama API :4000" "npm run dev:ollama"

# 3) Speech STT/TTS (:8000)
$speechCmd = "cd services\speech && call .venv\Scripts\activate.bat && uvicorn main:app --host 127.0.0.1 --port 8000"
Start-ServiceWindow "3 Speech :8000" $speechCmd

# 4) Web UI (:3000)
Start-ServiceWindow "4 Web UI :3000" "npm run dev:web"

Write-Host ""
Write-Host "Done. Open http://localhost:3000 in your browser."
Write-Host ""
Write-Host "First time only:"
Write-Host "  npm run ollama:pull"
Write-Host "  (speech) python download_models.py"
Write-Host ""
