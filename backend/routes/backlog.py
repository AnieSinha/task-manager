from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
from datetime import datetime
import uuid
from enum import Enum

from models import Backlog_Item
from utils.database import engine
from middleware.auth_middleware import verify_token

router = APIRouter()


# Request model for POST API
class BacklogRequest(BaseModel):
    title: str
    description: str
    priority: str


# Enums for Swagger dropdown
class StatusEnum(str, Enum):
    pending = "Pending"
    in_progress = "In Progress"
    completed = "Completed"


class PriorityEnum(str, Enum):
    high = "High"
    medium = "Medium"
    low = "Low"


# Create backlog item
@router.post("/backlog")
def create_backlog(
    backlog: BacklogRequest,
    payload=Depends(verify_token)
):

    user_id = uuid.UUID(payload.get("sub"))

    new_backlog = Backlog_Item(
        backlog_item_id=uuid.uuid4(),
        created_by=user_id,
        title=backlog.title,
        description=backlog.description,
        priority=backlog.priority,
        status="Pending",
        created_at=datetime.now()
    )

    with Session(engine) as session:
        session.add(new_backlog)
        session.commit()

    return {
        "message": "Backlog item created successfully"
    }


@router.get("/backlog")
def get_backlog(
    status: StatusEnum = None,
    priority: PriorityEnum = None
):

    with Session(engine) as session:

        statement = select(Backlog_Item)

        if status:
            statement = statement.where(
                Backlog_Item.status == status
            )

        if priority:
            statement = statement.where(
                Backlog_Item.priority == priority
            )

        backlog_items = session.exec(statement).all()

        return backlog_items