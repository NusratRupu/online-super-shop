param(
  [string]$DbUser = "root",
  [string]$DbPassword = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$resetSql = Join-Path $root "database\reset.sql"

if (-not (Test-Path $resetSql)) {
  throw "database/reset.sql not found. Run scripts/export-db.ps1 on the working laptop first."
}

$candidates = @(
  "C:\xampp\mysql\bin",
  "D:\xampp\mysql\bin",
  "$env:XAMPP_HOME\mysql\bin"
) | Where-Object { $_ -and (Test-Path $_) }

$mysqlBin = $candidates | Select-Object -First 1
if (-not $mysqlBin) {
  throw "Could not find XAMPP MySQL bin folder. Install/start XAMPP first."
}

$mysql = Join-Path $mysqlBin "mysql.exe"
$argsBase = @("-u", $DbUser)
if ($DbPassword) { $argsBase += "-p$DbPassword" }

Write-Host "[setup-dev] Importing database/reset.sql..."
Get-Content $resetSql -Raw | & $mysql @argsBase

Write-Host "[setup-dev] Installing backend packages..."
Push-Location (Join-Path $root "backend")
npm install
Pop-Location

Write-Host "[setup-dev] Installing frontend packages..."
Push-Location (Join-Path $root "frontend")
npm install
Pop-Location

Write-Host "[setup-dev] Done. Now run: .\scripts\start-dev.ps1"
