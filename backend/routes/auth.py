from fastapi import APIRouter
from pydantic import BaseModel
from sqlmodel import Session
import bcrypt
from models import User
from utils.database import engine
from datetime import datetime

router = APIRouter()

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

@router.post("/signup")
def signup(user: SignupRequest):

    hashed_password = bcrypt.hashpw(
        user.password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        created_at=datetime.now(),
        is_active=True
    )

    with Session(engine) as session:
        session.add(new_user)
        session.commit()

    return {
        "message": "User registered successfully"
    }