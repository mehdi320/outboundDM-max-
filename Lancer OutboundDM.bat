@echo off
REM Double-clic : installe les dependances au premier lancement, demarre l app et ouvre le navigateur.
cd /d "%~dp0"
where npm >nul 2>nul || (echo Node.js n est pas installe : telecharge-le sur https://nodejs.org puis relance. & pause & exit /b 1)
if not exist node_modules call npm install
call npm start
pause
