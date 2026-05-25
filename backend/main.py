from fastapi import FastAPI
from sqlmodel import SQLModel

from routes.auth import router as auth_router
from routes.task import router as task_router

from utils.database import engine
from models import *
from routes.backlog import router as backlog_router
from routes.feature import router as feature_router
from routes.story import router as story_router

app = FastAPI()

SQLModel.metadata.create_all(engine)

app.include_router(auth_router)
app.include_router(backlog_router)
app.include_router(feature_router)
app.include_router(story_router)
app.include_router(task_router)

@app.get("/")
def root():
    return {"message": "API Running"}