@echo off

:: Call Python script and capture output
for /f "tokens=1,2 delims= " %%A in ('python parse_json_to_bat.py') do (
    set "DEVICE=%%A"
    set "CUDA=%%B"
)

call npm install

start cmd.exe /C "echo FRONTEND Terminal && cd frontend && npm run dev"

start cmd.exe /C "echo BACKEND Terminal && cd backend && npm run start"

if "%DEVICE%"=="CPU" (
    start cmd.exe /C "echo AI SERVER Terminal && conda activate CARE && cd backend\ai_server && python app.py"
) else (
    start cmd.exe /C "echo AI SERVER Terminal && conda activate CARE-GPU && cd backend\ai_server && python app.py"
)

timeout /t 2
start chrome --incognito http://localhost:5173

%start msedge --inprivate http://localhost:5173