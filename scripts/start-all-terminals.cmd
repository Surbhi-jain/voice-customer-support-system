@echo off
REM Windows CMD launcher — opens 4 cmd windows via PowerShell helper.
cd /d "%~dp0.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-all-windows-cmd.ps1"
pause
