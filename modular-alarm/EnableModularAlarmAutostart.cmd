@echo off
setlocal
set "APP=%~dp0ModularAlarm.exe"

if not exist "%APP%" (
  echo ModularAlarm.exe was not found next to this file.
  pause
  exit /b 1
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$app = [IO.Path]::GetFullPath('%~dp0ModularAlarm.exe'); New-Item -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Force | Out-Null; New-ItemProperty -Path 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -Name 'ModularAlarm' -Value ('\"' + $app + '\"') -PropertyType String -Force | Out-Null"
if errorlevel 1 (
  echo Failed to enable startup launch.
  pause
  exit /b 1
)

echo Modular Alarm will launch when Windows starts.
start "" "%APP%"
timeout /t 2 >nul
