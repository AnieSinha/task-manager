from fastapi import FastAPI
from routes.auth import router as auth_router
from sqlmodel import SQLModel
from utils.database import engine
from backend.app.models import *

SQLModel.metadata.create_all(engine)

app = FastAPI()

app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "API Running"}
