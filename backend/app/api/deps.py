from typing import Annotated, Generator
import uuid
from fastapi import Depends, HTTPException, status
import jwt
from sqlmodel import Session, select
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError

from app.core.db import engine
from app.core.config import settings
from app.models import Role, TokenPayload, User, User_Role
from app.core import security
from app.core.permissions import ROLE_PERMISSIONS, Permission
from app.crud import get_user_roles

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, uuid.UUID(token_data.sub))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_permission(permission: Permission):

    def dependency(
        current_user: CurrentUser,
        session: SessionDep,
    ):

        roles: list[tuple[Role, User_Role]] = get_user_roles(
            session,
            current_user.user_id,
        )

        permissions = set()

        for role, ur in roles:
            permissions |= ROLE_PERMISSIONS.get(role.role_name, set())

        if permission not in permissions:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions",
            )

        return current_user

    return Depends(dependency)
