import uuid
from sqlmodel import Session
from models import Notification


def create_notification(session: Session, user_id: uuid.UUID, message: str) -> None:
    """Add a notification to the open session. Caller is responsible for commit."""
    session.add(Notification(user_id=user_id, message=message))
