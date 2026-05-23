from fastapi import APIRouter

from app.crud import authenticate, create_user
from app.api.deps import SessionDeps
from app.models import UserLogin, UserRegister

router = APIRouter()


@router.post("/signup")
def signup(*, session: SessionDeps, user_request: UserRegister):
    user = create_user(
        session=session,
        user_create=user_request,
    )
    return user


@router.post("/login")
def login(*, session: SessionDeps, user_request: UserLogin):
    authenticate(
        session=session,
        email=user_request.email,
        password=user_request.password,
    )
    return {"message": "User registered successfully"}
