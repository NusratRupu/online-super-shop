$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

$mysqlRunning = Get-Process mysqld -ErrorAction SilentlyContinue
if (-not $mysqlRunning) {
  Write-Host "[start-dev] MySQL is not running. Start XAMPP MySQL first, then run this script again." -ForegroundColor Yellow
  exit 1
}

Write-Host "[start-dev] Starting backend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$root\backend`"; npm run dev"

Start-Sleep -Seconds 3

Write-Host "[start-dev] Starting frontend..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd `"$root\frontend`"; npm run dev"

Start-Sleep -Seconds 5

Write-Host "[start-dev] Opening website..."
Start-Process "http://localhost:3000"

Write-Host "[start-dev] If Vite uses port 3001, open http://localhost:3001 manually."
