from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
from datetime import datetime
import uuid
from enum import Enum

from models import Task
from utils.database import engine
from middleware.auth_middleware import verify_token
from middleware.rbac_middleware import require_role, require_task_access
from utils.activity_logger import log_activity
from utils.notification_service import create_notification

router = APIRouter()


# ENUMS → Swagger will show dropdown
class StatusEnum(str, Enum):
    pending = "Pending"
    in_progress = "In Progress"
    completed = "Completed"


class PriorityEnum(str, Enum):
    high = "High"
    medium = "Medium"
    low = "Low"


class TaskRequest(BaseModel):
    story_id: str
    title: str
    description: str
    priority: str
    due_date: datetime


@router.post("/tasks")
def create_task(
    task: TaskRequest,
    payload=Depends(require_role("Admin")),
):

    new_task = Task(
        task_id=uuid.uuid4(),
        story_id=uuid.UUID(task.story_id),
        parent_task_id=None,
        created_by=uuid.UUID(payload.get("sub")),
        title=task.title,
        description=task.description,
        status="Pending",
        priority=task.priority,
        due_date=task.due_date,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    with Session(engine) as session:
        session.add(new_task)
        session.commit()

    return {
        "message": "Task created successfully"
    }


@router.get("/tasks")
def get_tasks(
    status: StatusEnum = None,
    priority: PriorityEnum = None,
    story_id: str = None
):

    with Session(engine) as session:

        statement = select(Task)

        # Filter by status
        if status:
            statement = statement.where(Task.status == status)

        # Filter by priority
        if priority:
            statement = statement.where(Task.priority == priority)

        # Filter by story_id
        if story_id:
            statement = statement.where(Task.story_id == uuid.UUID(story_id))

        tasks = session.exec(statement).all()

        return tasks
@router.get("/tasks/filter")
def filter_tasks(
    status: StatusEnum = None,
    priority: PriorityEnum = None,
    due_date: datetime | None = None,
    _payload=Depends(verify_token),
):
    with Session(engine) as session:
        statement = select(Task)
        if status:
            statement = statement.where(Task.status == status)
        if priority:
            statement = statement.where(Task.priority == priority)
        if due_date:
            statement = statement.where(Task.due_date <= due_date)
        return session.exec(statement).all()


class TaskUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    due_date: datetime | None = None


@router.get("/tasks/{task_id}")
def get_task(task_id: str):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Task, uuid.UUID(task_id))
        if not item:
            raise HTTPException(status_code=404, detail="Task not found")
        return item


@router.patch("/tasks/{task_id}")
def update_task(task_id: str, payload: TaskUpdateRequest, payload_user=Depends(verify_token)):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Task, uuid.UUID(task_id))
        if not item:
            raise HTTPException(status_code=404, detail="Task not found")
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        item.updated_at = datetime.now()
        session.add(item)
        session.commit()
        session.refresh(item)
        return item


class TaskStatusRequest(BaseModel):
    status: str


@router.patch("/tasks/{task_id}/status")
def update_task_status(
    task_id: str,
    payload: TaskStatusRequest,
    rbac_payload=Depends(require_task_access),
):
    user_id = uuid.UUID(rbac_payload.get("sub"))
    with Session(engine) as session:
        task = session.get(Task, uuid.UUID(task_id))
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")
        task.status = payload.status
        task.updated_at = datetime.now()
        session.add(task)
        log_activity(session, user_id, "STATUS_UPDATED", "Task", task.task_id)
        if task.created_by != user_id:
            create_notification(
                session,
                task.created_by,
                f"Task '{task.title}' status updated to '{payload.status}'",
            )
        session.commit()
        session.refresh(task)
        return task


@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, payload_user=Depends(require_role("Admin"))):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Task, uuid.UUID(task_id))
        if not item:
            raise HTTPException(status_code=404, detail="Task not found")
        session.delete(item)
        session.commit()
        return {"message": "Task deleted"}