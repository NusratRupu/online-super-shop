$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

Write-Host "Installing backend packages..." -ForegroundColor Green
Push-Location "$root\backend"
npm install
Pop-Location

Write-Host "Installing frontend packages..." -ForegroundColor Green
Push-Location "$root\frontend"
npm install
Pop-Location

Write-Host "Setup done. Restore database with RESTORE-DATABASE.bat, then start XAMPP MySQL and run START-NITYOMART.bat." -ForegroundColor Green
pause
