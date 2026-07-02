@echo off
echo Starting Client and Server...

:: Start the server in a new window
start "Server" cmd /k "cd server && npm install && npm run dev"

:: Start the client in a new window
start "Client" cmd /k "cd client && npm install && npm run dev"

echo Project is starting in separate windows!
