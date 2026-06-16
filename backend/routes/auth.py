from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from jose import jwt
from datetime import datetime, timedelta
import bcrypt

from models import User
from utils.database import engine
from middleware.auth_middleware import verify_token

router = APIRouter()

SECRET_KEY = "mysecretkey"
ALGORITHM = "HS256"


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/signup")
def signup(user: SignupRequest):

    with Session(engine) as session:

        existing_user = session.exec(
            select(User).where(User.email == user.email)
        ).first()

        if existing_user:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )

        hashed_password = bcrypt.hashpw(
            user.password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

        new_user = User(
            name=user.name,
            email=user.email,
            hashed_password=hashed_password,
            created_at=datetime.now(),
            is_active=True
        )

        session.add(new_user)
        session.commit()

    return {
        "message": "User registered successfully"
    }


@router.post("/login")
def login(user: LoginRequest):

    with Session(engine) as session:

        statement = select(User).where(User.email == user.email)
        db_user = session.exec(statement).first()

        if not db_user:
            return {"message": "Invalid email or password"}

        password_match = bcrypt.checkpw(
            user.password.encode('utf-8'),
            #db_user.password_hash.encode('utf-8')
            db_user.hashed_password.encode('utf-8')
        )  

        if not password_match:
            return {"message": "Invalid email or password"}

        token_data = {
            "sub": str(db_user.user_id),
            "exp": datetime.utcnow() + timedelta(hours=1)
        }

        token = jwt.encode(
            token_data,
            SECRET_KEY,
            algorithm=ALGORITHM
        )

        return {
            "message": "Login successful",
            "token": token
        }


@router.get("/protected")
def protected_route(payload=Depends(verify_token)):

    return {
        "message": "Protected route accessed",
        "user": payload
    }