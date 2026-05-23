$ErrorActionPreference = "Stop"

$zipPath = Join-Path $PSScriptRoot "..\database\xampp-mysql-data.zip"
$xamppData = "C:\xampp\mysql\data"
$backupPath = "C:\xampp\mysql\data_backup_before_nityomart_$(Get-Date -Format yyyyMMdd_HHmmss)"

if (!(Test-Path $zipPath)) {
  throw "DB backup zip not found: $zipPath"
}

Write-Host "Stop XAMPP MySQL before continuing." -ForegroundColor Yellow
pause

if (Test-Path $xamppData) {
  Rename-Item $xamppData $backupPath
  Write-Host "Existing XAMPP data backed up to: $backupPath"
}

New-Item -ItemType Directory -Force $xamppData | Out-Null
Expand-Archive -Path $zipPath -DestinationPath $xamppData -Force

Write-Host "Database restored. Now start XAMPP MySQL, then run START-NITYOMART.bat" -ForegroundColor Green
pause
