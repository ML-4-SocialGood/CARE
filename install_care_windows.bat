:: Deprecated. Non functional.
@echo off

:: Call Python script and capture output
for /f "tokens=1,2 delims= " %%A in ('python parse_json_to_bat.py') do (
    set "DEVICE=%%A"
    set "CUDA=%%B"
)

set "FOUND=0"
start cmd.exe /K "cd %USERPROFILE%\anaconda3\Scripts && activate.bat %USERPROFILE%\anaconda3 && conda init && exit"

echo CARE Web Platform - Installer
echo The installation will begin...
echo.

for %%A in (11.8 12.4 12.6 None) do (
    if "%CUDA%"=="%%A" set "FOUND=1"
)

if "%FOUND%"=="0" (
    echo The CUDA version is invalid.
	echo Please follow the instructions on the Github: https://github.com/ML-4-SocialGood/CARE if you want to install the GPU version.
	exit /b
)

call cd backend\ai_server

if "%DEVICE%"=="CPU" (
	echo This is the installation of the CPU version.
	echo If you want to download the GPU version, please follow the instructions on the Github: https://github.com/ML-4-SocialGood/CARE.
	echo.
    call conda env create --file environment_universal.yml
) else (
    echo This is the installation of the GPU version.
    echo.
	call conda create --name CARE-GPU python=3.10 -y
	call conda activate CARE-GPU

	if "%CUDA%"=="11.8" (
	    pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
	) else if "%CUDA%"=="12.4" (
	    pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu124
	) else if "%CUDA%"=="12.6" (
	    pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126
	)

    call conda install flask pip -y
    call conda install -c conda-forge opencv python-dotenv yacs -y
    call pip install ultralytics
	call conda deactivate
)
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