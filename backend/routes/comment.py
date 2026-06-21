from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select
import uuid

from models import Comment, Task
from utils.database import engine
from middleware.auth_middleware import verify_token
from utils.activity_logger import log_activity
from utils.notification_service import create_notification

router = APIRouter()


class CommentRequest(BaseModel):
    text: str


@router.post("/tasks/{task_id}/comment")
def add_comment(task_id: str, comment: CommentRequest, payload=Depends(verify_token)):
    user_id = uuid.UUID(payload.get("sub"))
    with Session(engine) as session:
        task = session.get(Task, uuid.UUID(task_id))
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        new_comment = Comment(
            task_id=uuid.UUID(task_id),
            user_id=user_id,
            text=comment.text,
        )
        session.add(new_comment)
        log_activity(session, user_id, "COMMENT_ADDED", "Task", uuid.UUID(task_id))
        if task.created_by != user_id:
            create_notification(
                session,
                task.created_by,
                f"A comment was added to task '{task.title}'",
            )
        session.commit()
        session.refresh(new_comment)
        return new_comment


@router.get("/tasks/{task_id}/comments")
def get_comments(task_id: str, _payload=Depends(verify_token)):
    with Session(engine) as session:
        task = session.get(Task, uuid.UUID(task_id))
        if not task:
            raise HTTPException(status_code=404, detail="Task not found")

        statement = select(Comment).where(Comment.task_id == uuid.UUID(task_id))
        comments = session.exec(statement).all()
        return comments
