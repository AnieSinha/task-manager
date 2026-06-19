from fastapi import FastAPI
from sqlmodel import SQLModel

from routes.auth import router as auth_router
from routes.task import router as task_router

from utils.database import engine
from models import *
from routes.backlog import router as backlog_router
from routes.feature import router as feature_router
from routes.story import router as story_router
from fastapi.middleware.cors import CORSMiddleware

# Keep both routes
from routes.task_assignment import router as task_assignment_router
from routes.dashboard import router as dashboard_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SQLModel.metadata.create_all(engine)

# Existing routers
app.include_router(auth_router)
app.include_router(backlog_router)
app.include_router(feature_router)
app.include_router(story_router)
app.include_router(task_router)

# Keep both newly added routers
app.include_router(task_assignment_router)
app.include_router(dashboard_router)


@app.get("/")
def root():
    return {"message": "API Running"}