from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session
import uuid

from models import Task_Assignments
from utils.database import engine
from middleware.auth_middleware import verify_token

router = APIRouter()


class TaskAssignmentRequest(BaseModel):
    task_id: str
    assigned_to: str
    reason: str


@router.post("/task-assignments")
def assign_task(
    assignment: TaskAssignmentRequest,
    payload=Depends(verify_token)
):

    # logged in user becomes assigned_by
    assigned_by = uuid.UUID(payload.get("sub"))

    new_assignment = Task_Assignments(
        task_assignment_id=uuid.uuid4(),
        task_id=uuid.UUID(assignment.task_id),
        assigned_to=uuid.UUID(assignment.assigned_to),
        assigned_by=assigned_by,
        reason=assignment.reason
    )

    with Session(engine) as session:
        session.add(new_assignment)
        session.commit()

    return {
        "message": "Task assigned successfully"
    }