@echo off

echo CARE Web Platform - Installer
echo The installation will begin...

call cd backend\ai_server
call conda env create -f environment_universal.yml
if %errorlevel% neq 0 (
    echo WARNING: Failed to create the anaconda environment. You should restart the installer, or consider manual installation.
    echo NOTICE: If you already created the anaconda environment, you can ignore this message.
)

call cd ..
call npm install
if %errorlevel% neq 0 (
    echo WARNING: Failed to install backend dependencies. You should restart the installer, or consider manual installation.
    echo Press any key to close this window...
    pause
    exit /b %errorlevel%
)

call cd ..
call cd frontend
call npm install
if %errorlevel% neq 0 (
    echo WARNING: Failed to install frontend dependencies. You should restart the installer, or consider manual installation.
    echo Press any key to close this window...
    pause
    exit /b %errorlevel%
)

echo CARE Web Platform installation has been completed successfully.
echo Press any key to close this window...
pause >nul
exit