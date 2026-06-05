# Task Manager

Full-stack task manager with role-based access.

## Setup
- Backend: 
python -m venv .venv
pip install -r requirements.txt
cd backend
uvicorn main:app --reload

- Frontend: cd frontend → npm start

## Using Docker

docker compose up -d --build

docker compose down