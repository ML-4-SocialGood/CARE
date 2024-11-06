@echo off

echo CARE Web Platform - Prerequisites Installer
echo The installation will begin...

call winget install --id=Anaconda.Anaconda3 -e --accept-source-agreements --accept-package-agreements --force
if %errorlevel% neq 0 (
    echo WARNING: Anaconda installation failed. You should restart the installer, or consider manual installation.
    echo Press any key to close this window...
    pause >nul
    exit /b %errorlevel%
)

call winget install --id=OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements --force
if %errorlevel% neq 0 (
    echo WARNING: Node.js installation failed. You should restart the installer or consider a manual installation.
    echo Press any key to close this window...
    pause >nul
    exit /b %errorlevel%
)

start cmd.exe /K "cd %USERPROFILE%\anaconda3\Scripts && activate.bat %USERPROFILE%\anaconda3 && conda init && exit"

echo Prerequisites installation has been completed successfully.
echo "Don't forget to place the two model files 'best_50.pt' and 'CARE_Traced.pt' in '<project directory>\backend\ai_server'."
echo Press any key to close this window...
pause >nul
exit