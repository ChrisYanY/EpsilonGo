#!/bin/bash
echo "Starting EpsilonGo..."

# Helper to check if a command exists
command_exists () {
    type "$1" &> /dev/null ;
}

# Backend Setup
echo "=== Backend Setup ==="
cd backend

# Determine Python command
if command_exists python3; then
    PYTHON_CMD="python3"
elif command_exists python; then
    PYTHON_CMD="python"
else
    echo "Error: Python not found. Please install Python 3."
    exit 1
fi

echo "Using Python: $PYTHON_CMD"

# Create Virtual Environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    $PYTHON_CMD -m venv venv
fi

# Activate Venv
source venv/bin/activate

# Install Requirements inside Venv
echo "Installing/Checking backend requirements in venv..."
pip install -r requirements.txt

# Start Backend using venv's python
echo "Starting Backend on port 8000..."
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend Setup
echo "=== Frontend Setup ==="
cd ../frontend
echo "Starting Frontend..."
npm run dev &
FRONTEND_PID=$!

echo "------------------------------------------------"
echo "EpsilonGo is running!"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "------------------------------------------------"
echo "Press CTRL+C to stop both servers"

trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
