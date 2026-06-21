from fastapi import Depends, HTTPException
from sqlmodel import Session, select
import uuid

from models import User_Role, Role, Task_Assignments
from utils.database import engine
from middleware.auth_middleware import verify_token


def require_role(*allowed_roles: str):
    """Dependency factory — passes if the JWT user holds any of the allowed roles."""
    def dependency(payload=Depends(verify_token)):
        user_id = uuid.UUID(payload.get("sub"))
        with Session(engine) as session:
            roles = session.exec(
                select(Role)
                .join(User_Role, User_Role.role_id == Role.role_id)
                .where(User_Role.user_id == user_id)
            ).all()
        user_roles = {r.role_name for r in roles}
        if not user_roles.intersection(allowed_roles):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return payload
    return dependency


def require_task_access(task_id: str, payload=Depends(verify_token)):
    """Admin/Manager pass freely. Developer passes only if assigned to the task."""
    user_id = uuid.UUID(payload.get("sub"))
    with Session(engine) as session:
        roles = session.exec(
            select(Role)
            .join(User_Role, User_Role.role_id == Role.role_id)
            .where(User_Role.user_id == user_id)
        ).all()
        user_roles = {r.role_name for r in roles}

        if "Admin" in user_roles or "Manager" in user_roles:
            return payload

        if "Developer" in user_roles:
            assignment = session.exec(
                select(Task_Assignments).where(
                    Task_Assignments.task_id == uuid.UUID(task_id),
                    Task_Assignments.assigned_to == user_id,
                )
            ).first()
            if not assignment:
                raise HTTPException(
                    status_code=403,
                    detail="Developers can only update their assigned tasks",
                )
            return payload

    raise HTTPException(status_code=403, detail="Insufficient permissions")
