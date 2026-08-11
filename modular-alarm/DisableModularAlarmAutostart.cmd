@echo off
setlocal

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Remove-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'ModularAlarm' -ErrorAction SilentlyContinue"
if errorlevel 1 (
  echo Failed to disable startup launch.
  pause
  exit /b 1
)

echo Modular Alarm startup launch has been disabled.
timeout /t 2 >nul
