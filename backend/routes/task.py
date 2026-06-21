from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
from datetime import datetime
import uuid
from enum import Enum

from models import Task
from utils.database import engine
from middleware.auth_middleware import verify_token

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
    payload=Depends(verify_token)
):

    new_task = Task(
        task_id=uuid.uuid4(),
        story_id=uuid.UUID(task.story_id),
        parent_task_id=None,
        title=task.title,
        description=task.description,
        status="Pending",
        priority=task.priority,
        due_date=task.due_date,
        created_at=datetime.now(),
        updated_at=datetime.now()
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


@router.delete("/tasks/{task_id}")
def delete_task(task_id: str, payload_user=Depends(verify_token)):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Task, uuid.UUID(task_id))
        if not item:
            raise HTTPException(status_code=404, detail="Task not found")
        session.delete(item)
        session.commit()
        return {"message": "Task deleted"}