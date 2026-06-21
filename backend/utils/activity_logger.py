import uuid
from sqlmodel import Session
from models import Activity_Log


def log_activity(
    session: Session,
    user_id: uuid.UUID,
    action: str,
    entity_type: str,
    entity_id: uuid.UUID,
) -> None:
    """Add an activity log entry to the open session. Caller is responsible for commit."""
    session.add(Activity_Log(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
    ))
