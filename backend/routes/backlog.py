from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session
from datetime import datetime
import uuid

from models import Backlog_Item
from utils.database import engine
from middleware.auth_middleware import verify_token

router = APIRouter()


class BacklogRequest(BaseModel):
    title: str
    description: str
    priority: str


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