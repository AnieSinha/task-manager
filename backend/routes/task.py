from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
from datetime import datetime
import uuid

from models import Task
from utils.database import engine
from middleware.auth_middleware import verify_token
from datetime import datetime

router = APIRouter()


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
    status: str = None,
    priority: str = None,
    story_id: str = None
):

    with Session(engine) as session:

        statement = select(Task)

        if status:
            statement = statement.where(Task.status == status)

        if priority:
            statement = statement.where(Task.priority == priority)

        if story_id:
            statement = statement.where(Task.story_id == uuid.UUID(story_id))

        tasks = session.exec(statement).all()

        return tasks