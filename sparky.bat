@echo off
setlocal

if "%~1"=="" (
    echo Usage: sparky ^<code^>
    exit /b 1
)

set "code=%~1"

node parser.js %code%

endlocal