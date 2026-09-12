@echo off
title WinPManager - Web Dashboard
cd /d "%~dp0"
echo Starting WinPManager Web Mode on http://localhost:5199 ...
start http://localhost:5199
npm run web
