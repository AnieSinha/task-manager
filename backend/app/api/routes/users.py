# =============================================================================
# app/api/routes/users.py
# =============================================================================
import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import Session, select

import app.crud as crud
from app.api.deps import (
    CurrentUser,
    SessionDep,
    require_permission,
)
from app.core.permissions import Permission
from app.models import (
    Role,
    RolePublic,
    User,
    UserPublic,
    UserUpdate,
    User_Role,
)

router = APIRouter(prefix="/users", tags=["users"])


def _build_user_public(user: User, session: Session) -> UserPublic:
    role_rows = crud.get_user_roles(
        session=session,
        user_id=user.user_id,  # type: ignore[arg-type]
    )

    roles = [
        RolePublic(
            role_id=role.role_id,  # type: ignore[arg-type]
            role_name=role.role_name,
            description=role.description,
            assigned_at=ur.assigned_at,
        )
        for role, ur in role_rows
    ]

    return UserPublic(
        user_id=user.user_id,  # type: ignore[arg-type]
        name=user.name,
        email=user.email,
        is_active=user.is_active,
        created_at=user.created_at,
        roles=roles,
    )


@router.get("/me", response_model=UserPublic)
def read_me(
    current_user: CurrentUser,
    session: SessionDep,
):
    return _build_user_public(current_user, session)


@router.get("", response_model=dict)
def list_users(
    session: SessionDep,
    _=require_permission(Permission.USER_VIEW),
    limit: int = 25,
    offset: int = 0,
    is_active: bool | None = None,
):
    users, total = crud.get_users(
        session=session,
        limit=limit,
        offset=offset,
        is_active=is_active,
    )

    return {
        "data": [_build_user_public(u, session) for u in users],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router.get("/{user_id}", response_model=UserPublic)
def get_user(
    user_id: uuid.UUID,
    session: SessionDep,
    current_user: CurrentUser,
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.user_id != user_id:
        require_permission(Permission.USER_VIEW).dependency(
            current_user=current_user,
            session=session,
        )

    return _build_user_public(user, session)


@router.patch("/{user_id}", response_model=UserPublic)
def patch_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    session: SessionDep,
    current_user: CurrentUser,
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.user_id == user_id:
        if body.is_active is not None:
            require_permission(Permission.USER_UPDATE).dependency(
                current_user=current_user,
                session=session,
            )
    else:
        require_permission(Permission.USER_UPDATE).dependency(
            current_user=current_user,
            session=session,
        )

    updated = crud.update_user(
        session=session,
        user=user,
        update=body,
    )

    return _build_user_public(updated, session)


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: uuid.UUID,
    session: SessionDep,
    _=require_permission(Permission.USER_DELETE),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    crud.deactivate_user(session=session, user=user)


# -------------------------------------------------------------------------
# Role assignment
# -------------------------------------------------------------------------


@router.post("/{user_id}/roles", status_code=201)
def assign_role(
    user_id: uuid.UUID,
    body: dict,
    session: SessionDep,
    _=require_permission(Permission.ROLE_ASSIGN),
):
    role_id = uuid.UUID(body["role_id"])

    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = session.get(Role, role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    existing = session.exec(
        select(User_Role).where(
            User_Role.user_id == user_id,
            User_Role.role_id == role_id,
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Role already assigned to this user",
        )

    ur = crud.assign_user_role(
        session=session,
        user_id=user_id,
        role_id=role_id,
    )

    return {
        "user_id": user_id,
        "role_id": role_id,
        "assigned_at": ur.assigned_at,
    }


@router.delete("/{user_id}/roles/{role_id}", status_code=204)
def remove_role(
    user_id: uuid.UUID,
    role_id: uuid.UUID,
    session: SessionDep,
    _=require_permission(Permission.ROLE_REMOVE),
):
    crud.remove_user_role(
        session=session,
        user_id=user_id,
        role_id=role_id,
    )
