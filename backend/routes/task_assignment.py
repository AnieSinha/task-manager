from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
import uuid

from models import Task_Assignments, Task
from utils.database import engine
from middleware.auth_middleware import verify_token
from middleware.rbac_middleware import require_role
from utils.activity_logger import log_activity
from utils.notification_service import create_notification

router = APIRouter()


class TaskAssignmentRequest(BaseModel):
    task_id: str
    assigned_to: str
    reason: str


@router.post("/task-assignments")
def assign_task(
    assignment: TaskAssignmentRequest,
    payload=Depends(require_role("Admin", "Manager")),
):
    assigned_by = uuid.UUID(payload.get("sub"))

    new_assignment = Task_Assignments(
        task_assignment_id=uuid.uuid4(),
        task_id=uuid.UUID(assignment.task_id),
        assigned_to=uuid.UUID(assignment.assigned_to),
        assigned_by=assigned_by,
        reason=assignment.reason,
    )

    with Session(engine) as session:
        task = session.get(Task, uuid.UUID(assignment.task_id))
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        session.add(new_assignment)
        log_activity(session, assigned_by, "TASK_ASSIGNED", "Task", uuid.UUID(assignment.task_id))
        create_notification(
            session,
            uuid.UUID(assignment.assigned_to),
            f"You have been assigned to task '{task.title}'",
        )
        session.commit()

    return {
        "message": "Task assigned successfully"
    }


@router.get("/users/{user_id}/tasks")
def get_user_tasks(user_id: str, _payload=Depends(verify_token)):
    with Session(engine) as session:
        statement = (
            select(Task)
            .join(Task_Assignments, Task_Assignments.task_id == Task.task_id)
            .where(Task_Assignments.assigned_to == uuid.UUID(user_id))
        )
        tasks = session.exec(statement).all()
        return [
            {
                "task_id": task.task_id,
                "title": task.title,
                "priority": task.priority,
                "due_date": task.due_date,
                "status": task.status,
            }
            for task in tasks
        ]