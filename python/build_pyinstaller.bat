@echo off
setlocal

:: Get the directory where the script is located
set "SCRIPT_DIR=%~dp0"

if not defined VIRTUAL_ENV (
    echo Not in python venv; activate with:
    echo   .venv\Scripts\activate.bat
    exit /b 1
)

:: Check if model files exist
set "model[0]=models\vit_care.yml"
set "model[1]=models\CARE_Traced.pt"
set "model[2]=models\Detector.pt"
set "model[3]=models\Detector_GPU.pt"
set "model[4]=models\CARE_Traced_GPUv.pt"
for /L %%i in (0,1,4) do (
    call set "current_model=%%model[%%i]%%"
    if not exist "%SCRIPT_DIR%%current_model%" (
        echo %current_model% must exist. Contact project owners for model files.
        exit /b 1
    )
)

:: Don't use Conda; it's multiprocessing implementation is broken.
where conda >nul 2>&1
if not errorlevel 1 (
    echo DO NOT REDISTRIBUTE CONDA PYTHON
    exit /b 1
)

:: Run PyInstaller
pyinstaller ^
    --noconfirm ^
    --name care-detect-reid ^
    --distpath ..\care-electron\resources\ ^
    --add-data models\vit_care.yml;models ^
    --add-data models\CARE_Traced.pt;models ^
    --add-data models\CARE_Traced_GPUv.pt;models ^
    --add-data models\Detector.pt;models ^
    --add-data models\Detector_GPU.pt;models ^
    main.py

endlocal