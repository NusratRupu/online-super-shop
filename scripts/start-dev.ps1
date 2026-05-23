$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

Write-Host "Starting NityoMart BD..." -ForegroundColor Green

$mysql = Test-NetConnection localhost -Port 3306 -WarningAction SilentlyContinue
if (-not $mysql.TcpTestSucceeded) {
  Write-Host "Please start XAMPP MySQL first, then run this again." -ForegroundColor Red
  pause
  exit
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$root\backend`"; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$root\frontend`"; npm run dev"

Start-Sleep -Seconds 6
Start-Process "http://localhost:3000"
