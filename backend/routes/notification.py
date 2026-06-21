from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
import uuid

from models import Notification
from utils.database import engine
from middleware.auth_middleware import verify_token

router = APIRouter()


@router.get("/notifications")
def get_notifications(payload=Depends(verify_token)):
    user_id = uuid.UUID(payload.get("sub"))
    with Session(engine) as session:
        statement = select(Notification).where(Notification.user_id == user_id)
        return session.exec(statement).all()


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, payload=Depends(verify_token)):
    user_id = uuid.UUID(payload.get("sub"))
    with Session(engine) as session:
        notification = session.get(Notification, uuid.UUID(notification_id))
        if not notification:
            raise HTTPException(status_code=404, detail="Notification not found")
        if notification.user_id != user_id:
            raise HTTPException(status_code=403, detail="Not your notification")
        notification.is_read = True
        session.add(notification)
        session.commit()
        session.refresh(notification)
        return notification
