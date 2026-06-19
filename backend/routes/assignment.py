from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
import uuid
from datetime import datetime

from models import Task_Assignments, User
from utils.database import engine
from middleware.auth_middleware import verify_token

router = APIRouter()


class AssignTaskRequest(BaseModel):
    assigned_to: str
    reason: str


@router.post("/tasks/{task_id}/assign")
def assign_task(task_id: str, payload: AssignTaskRequest, payload_user=Depends(verify_token)):
    assigner_id = uuid.UUID(payload_user.get("sub"))

    new_assignment = Task_Assignments(
        task_assignment_id=uuid.uuid4(),
        task_id=uuid.UUID(task_id),
        assigned_to=uuid.UUID(payload.assigned_to),
        assigned_by=assigner_id,
        assigned_at=datetime.now(),
        reason=payload.reason
    )

    with Session(engine) as session:
        session.add(new_assignment)
        session.commit()

    return {"message": "Task assigned successfully"}


@router.get("/tasks/{task_id}/assignments")
def get_task_assignments(task_id: str):
    with Session(engine) as session:
        statement = select(Task_Assignments).where(
            Task_Assignments.task_id == uuid.UUID(task_id)
        )
        return session.exec(statement).all()


@router.get("/users")
def get_users(payload_user=Depends(verify_token)):
    with Session(engine) as session:
        statement = select(User.user_id, User.name, User.email)
        return session.exec(statement).all()