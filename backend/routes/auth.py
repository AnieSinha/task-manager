from fastapi import APIRouter
from pydantic import BaseModel
import bcrypt

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
    )

    return {
        "message": "Signup successful",
        "hashed_password": hashed_password.decode('utf-8')
    }