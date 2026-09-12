@echo off
title WinPManager Sentinel Microservice
cd /d "%~dp0"
echo Starting WinPManager Terminal Conflict Sentinel Microservice...
node microservice/sentinel.cjs
