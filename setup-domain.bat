@echo off
:: Nexora Smart Learning - Local Domain Setup Script
:: Right-click this file and select "Run as administrator" to enable http://nexora-smart-learning:8080 in your browser!

echo ========================================================
echo  Configuring local domain for Nexora Smart Learning...
echo ========================================================

powershell -Command "if (-not (Select-String -Path 'C:\Windows\System32\drivers\etc\hosts' -Pattern 'nexora-smart-learning' -Quiet)) { Add-Content -Path 'C:\Windows\System32\drivers\etc\hosts' -Value \"`n127.0.0.1 nexora-smart-learning\" -Force; Write-Host 'Successfully mapped nexora-smart-learning!' } else { Write-Host 'nexora-smart-learning is already configured in hosts!' }"

echo.
echo You can now access your platform at:
echo http://nexora-smart-learning:8080
echo ========================================================
pause
