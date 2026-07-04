# =============================================================================
# app/api/routes/roles.py
# =============================================================================
import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import select

import app.crud as crud
from app.api.deps import SessionDep, require_permission
from app.core.permissions import Permission
from app.models import Role, RoleCreate, RolePublic, User_Role

router_roles = APIRouter(prefix="/roles", tags=["roles"])


@router_roles.get("", response_model=dict)
def list_roles(
    session: SessionDep,
    _=require_permission(Permission.ROLE_VIEW),
    limit: int = 25,
    offset: int = 0,
):
    roles, total = crud.get_roles(
        session=session,
        limit=limit,
        offset=offset,
    )

    return {
        "data": [
            RolePublic(
                role_id=r.role_id,  # type: ignore[arg-type]
                role_name=r.role_name,
                description=r.description,
            )
            for r in roles
        ],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router_roles.post(
    "",
    status_code=201,
    response_model=RolePublic,
)
def create_role(
    body: RoleCreate,
    session: SessionDep,
    _=require_permission(Permission.ROLE_ASSIGN),
):
    existing = session.exec(
        select(Role).where(Role.role_name == body.role_name)
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Role name already exists",
        )

    role = crud.create_role(
        session=session,
        role_create=body,
    )

    return RolePublic(
        role_id=role.role_id,  # type: ignore[arg-type]
        role_name=role.role_name,
        description=role.description,
    )


@router_roles.delete(
    "/{role_id}",
    status_code=204,
)
def delete_role(
    role_id: uuid.UUID,
    session: SessionDep,
    _=require_permission(Permission.ROLE_REMOVE),
):
    role = session.get(Role, role_id)

    if not role:
        raise HTTPException(
            status_code=404,
            detail="Role not found",
        )

    assigned = session.exec(
        select(User_Role).where(User_Role.role_id == role_id)
    ).first()

    if assigned:
        raise HTTPException(
            status_code=409,
            detail="Role is still assigned to one or more users",
        )

    session.delete(role)
    session.commit()
