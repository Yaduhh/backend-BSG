@echo off
echo Setting environment variables for Bosgil Group Backend...

set API_BASE_URL=http://192.168.30.130:3000
set FRONTEND_URL=http://192.168.30.130:5173
set DB_HOST=192.168.30.130
set NODE_ENV=development

echo Environment variables set:
echo API_BASE_URL=%API_BASE_URL%
echo FRONTEND_URL=%FRONTEND_URL%
echo DB_HOST=%DB_HOST%
echo NODE_ENV=%NODE_ENV%

echo.
echo Now you can run: npm run dev
pause
