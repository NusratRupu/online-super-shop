@echo off
echo ===============================
echo NityoMart BD Demo Health Check
echo ===============================

echo.
echo [1] Checking MySQL database...
"C:\xampp\mysql\bin\mysql.exe" -u root -e "USE online_super_shop; SELECT COUNT(*) AS products FROM products; SELECT COUNT(*) AS users FROM users; SELECT COUNT(*) AS orders FROM orders; SELECT COUNT(*) AS seller_records FROM seller_earnings;" || goto fail

echo.
echo [2] Checking backend API...
powershell -Command "Invoke-RestMethod http://localhost:5000/api/products | Out-Null; Write-Host 'Backend API OK'" || goto fail

echo.
echo [3] Checking frontend...
powershell -Command "$r = Invoke-WebRequest http://localhost:3000 -UseBasicParsing; if ($r.StatusCode -eq 200) { Write-Host 'Frontend OK' } else { exit 1 }" || goto fail

echo.
echo Demo check PASSED.
pause
exit /b 0

:fail
echo.
echo Demo check FAILED.
echo Make sure XAMPP MySQL, backend, and frontend are running.
pause
exit /b 1
