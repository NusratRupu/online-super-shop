param(
  [string]$DbName = "nityomart_bd",
  [string]$DbUser = "root",
  [string]$DbPassword = ""
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dbDir = Join-Path $root "database"
New-Item -ItemType Directory -Force $dbDir | Out-Null

$candidates = @(
  "C:\xampp\mysql\bin",
  "D:\xampp\mysql\bin",
  "$env:XAMPP_HOME\mysql\bin"
) | Where-Object { $_ -and (Test-Path $_) }

$mysqlBin = $candidates | Select-Object -First 1
if (-not $mysqlBin) {
  throw "Could not find XAMPP MySQL bin folder. Start XAMPP or install it in C:\xampp."
}

$dump = Join-Path $mysqlBin "mysqldump.exe"

$argsBase = @("-u", $DbUser)
if ($DbPassword) { $argsBase += "-p$DbPassword" }

Write-Host "[export-db] Exporting schema.sql..."
& $dump @argsBase "--no-data" "--routines" "--triggers" $DbName "--result-file=$(Join-Path $dbDir 'schema.sql')"

Write-Host "[export-db] Exporting seed.sql..."
& $dump @argsBase "--no-create-info" "--skip-triggers" $DbName "--result-file=$(Join-Path $dbDir 'seed.sql')"

Write-Host "[export-db] Exporting reset.sql..."
& $dump @argsBase "--add-drop-database" "--databases" $DbName "--routines" "--triggers" "--result-file=$(Join-Path $dbDir 'reset.sql')"

Write-Host "[export-db] Done: database/schema.sql, seed.sql, reset.sql"
