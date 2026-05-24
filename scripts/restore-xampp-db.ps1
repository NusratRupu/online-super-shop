$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$zipPath = Join-Path $root "database\xampp-mysql-data.zip"

if (!(Test-Path $zipPath)) {
  throw "Database backup zip not found: $zipPath"
}

$mysqlCandidates = @(
  "C:\xampp\mysql\bin\mysql.exe",
  "E:\xampp\mysql\bin\mysql.exe",
  "D:\xampp\mysql\bin\mysql.exe"
)

$mysqlExe = $mysqlCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1

if (!$mysqlExe) {
  throw "Could not find mysql.exe. Please install/start XAMPP first."
}

Write-Host "Detecting active MySQL data directory..." -ForegroundColor Cyan
$dataDir = (& $mysqlExe -u root -N -B -e "SELECT @@datadir;").Trim()

if (!$dataDir -or !(Test-Path $dataDir)) {
  throw "Could not detect valid MySQL data directory."
}

$dataDir = $dataDir.TrimEnd("\")
$backupDir = "${dataDir}_backup_before_nityomart_$(Get-Date -Format yyyyMMdd_HHmmss)"
$tempDir = Join-Path $root ".restore-temp"

Write-Host "Detected MySQL data directory:" -ForegroundColor Green
Write-Host $dataDir -ForegroundColor Yellow

Write-Host ""
Write-Host "IMPORTANT: Stop XAMPP MySQL now before continuing." -ForegroundColor Red
Write-Host "After MySQL is fully stopped, press any key here."
pause

$mysqlRunning = Get-Process mysqld -ErrorAction SilentlyContinue
if ($mysqlRunning) {
  throw "MySQL is still running. Stop XAMPP MySQL first, then run restore again."
}

if (Test-Path $tempDir) {
  Remove-Item $tempDir -Recurse -Force
}

New-Item -ItemType Directory -Force $tempDir | Out-Null

Write-Host "Backing up current data folder..." -ForegroundColor Cyan
Rename-Item $dataDir $backupDir

Write-Host "Creating fresh data folder..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force $dataDir | Out-Null

Write-Host "Extracting NityoMart database backup..." -ForegroundColor Cyan
Expand-Archive -Path $zipPath -DestinationPath $tempDir -Force

Write-Host "Restoring full MySQL data folder..." -ForegroundColor Cyan
Copy-Item "$tempDir\*" $dataDir -Recurse -Force

Remove-Item $tempDir -Recurse -Force

Write-Host ""
Write-Host "Restore completed successfully." -ForegroundColor Green
Write-Host "Previous data backup:" -ForegroundColor Yellow
Write-Host $backupDir
Write-Host ""
Write-Host "Now start XAMPP MySQL, then run START-NITYOMART.bat" -ForegroundColor Green
pause
