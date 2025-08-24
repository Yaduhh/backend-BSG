# PowerShell script to set environment variables for Bosgil Group Backend

Write-Host "Setting environment variables for Bosgil Group Backend..." -ForegroundColor Green

# Set environment variables
$env:API_BASE_URL = "http://192.168.30.130:3000"
$env:FRONTEND_URL = "http://192.168.30.130:5173"
$env:DB_HOST = "192.168.30.130"
$env:NODE_ENV = "development"

Write-Host "Environment variables set:" -ForegroundColor Yellow
Write-Host "API_BASE_URL: $env:API_BASE_URL" -ForegroundColor Cyan
Write-Host "FRONTEND_URL: $env:FRONTEND_URL" -ForegroundColor Cyan
Write-Host "DB_HOST: $env:DB_HOST" -ForegroundColor Cyan
Write-Host "NODE_ENV: $env:NODE_ENV" -ForegroundColor Cyan

Write-Host ""
Write-Host "Now you can run: npm run dev" -ForegroundColor Green
Write-Host "Or: npm start" -ForegroundColor Green

# Keep the session open
Read-Host "Press Enter to continue"
