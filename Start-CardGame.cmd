@echo off
cd /d "%~dp0"
node tools\start-cardgame.cjs
if errorlevel 1 pause
