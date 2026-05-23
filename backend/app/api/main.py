from fastapi import APIRouter
from app.api.routes import auth, backlogs

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(backlogs.router)
