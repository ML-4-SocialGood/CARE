@echo off

call npm install

start cmd.exe /C "echo FRONTEND Terminal && cd frontend && npm run dev"

start cmd.exe /C "echo BACKEND Terminal && cd backend && npm run start"

start cmd.exe /C "echo AI SERVER Terminal && conda activate CARE && cd backend\ai_server && python app.py"

timeout /t 2
start chrome --incognito http://localhost:5173

%start msedge --inprivate http://localhost:5173