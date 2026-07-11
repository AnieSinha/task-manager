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


def get_user_role_names(user: User, session: Session) -> set[str]:
    """Return the set of role_name strings assigned to a user."""
    rows = session.exec(
        select(Role.role_name).join(User_Role).where(User_Role.user_id == user.user_id)
    ).all()
    return set(rows)


def is_developer_only(user: User, session: Session) -> bool:
    """True if the user has the Developer role and is NOT also a superuser.
    Superusers are never restricted, even if also tagged Developer."""
    names = get_user_role_names(user, session)
    return "Developer" in names and "SUPER_USER" not in names


def enforce_developer_field_restriction(
    current_user: User, session: Session, changed_fields: set[str]
) -> None:
    """Developers may only PATCH description/status. Raises 403 otherwise."""
    if is_developer_only(current_user, session):
        allowed = {"description", "status"}
        if not changed_fields.issubset(allowed):
            raise HTTPException(
                status_code=403,
                detail="Developers can only edit the description and status.",
            )


def enforce_developer_no_delete(current_user: User, session: Session) -> None:
    """Developers cannot delete backlog/feature/story/task items."""
    if is_developer_only(current_user, session):
        raise HTTPException(
            status_code=403,
            detail="Developers cannot delete items in this section.",
        )


def get_current_active_superuser(
    current_user: CurrentUser, session: SessionDep
) -> User:
    # Check if a link exists between this user and the SUPER_USER role
    is_superuser = session.exec(
        select(User_Role)
        .join(Role)
        .where(
            User_Role.user_id == current_user.user_id, Role.role_name == "SUPER_USER"
        )
    ).first()

    if not is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )

    return current_user
