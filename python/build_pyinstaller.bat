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
set "model[0]=models\dino_adapter_inference.yaml"
set "model[1]=models\DinoAdapter_Stoat_day_night_mixed_precision.pth.tar25"
set "model[2]=models\md_v1000.0.0-redwood.pt"
set "model[3]=models\dino_binary_classifier_v3.pt"
set "model[4]=models\dino_species_classifier.pt"
set "model[5]=models\dinov3_vith16plus_pretrain_lvd1689m-7c1da9a5.pth"
for /L %%i in (0,1,6) do (
    call set "current_model=%%model[%%i]%%"
    if not exist "%SCRIPT_DIR%%current_model%" (
        echo %current_model% must exist. Contact project owners for model files.
        exit /b 1
    )
)

:: Check if dinov3 folder exists
if not exist "%SCRIPT_DIR%dinov3" (
    echo dinov3 folder must exist. Contact project owners for dinov3 files.
    exit /b 1
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
    --add-data models\dinoadapter_inference.yaml;models ^
    --add-data models\DinoAdapter_Stoat_day_night_mixed_precision.pth.tar25;models ^
    --add-data models\md_v1000.0.0-redwood.pt;models ^
    --add-data models\dino_binary_classifier_v3.pt;models ^
    --add-data models\dino_species_classifier.pt;models ^
    --add-data models\dinov3_vith16plus_pretrain_lvd1689m-7c1da9a5.pth;models ^
    --add-data dinov3;dinov3 ^
    main.py

endlocal