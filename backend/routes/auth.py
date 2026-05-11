from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

@router.post("/signup")
def signup(user: SignupRequest):
    return {
        "message": "Signup successful",
        "user": user
    }