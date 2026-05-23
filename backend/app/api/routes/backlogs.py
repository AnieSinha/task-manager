import uuid
from fastapi import APIRouter
from uuid import UUID
from app.api.deps import SessionDeps

from app.crud import (
    create_backlog,
    get_backlogs,
    get_backlog_by_id,
    update_backlog,
    delete_backlog,
)

from app.models import (
    BacklogCreate,
    BacklogUpdate,
)

router = APIRouter()
@router.post("/backlogs")
def add_backlog(
    session: SessionDeps,
    backlog: BacklogCreate,
):
    return create_backlog(
        session=session,
        backlog_create=backlog,
        user_id=UUID("550e8400-e29b-41d4-a716-446655440000")
    )
@router.get("/backlogs")
def all_backlogs(session: SessionDeps):
    return get_backlogs(session=session)

@router.get("/{backlog_item_id}")
def single_backlog(
    *,
    session: SessionDeps,
    backlog_item_id: uuid.UUID,
):
    return get_backlog_by_id(
        session=session,
        backlog_item_id=backlog_item_id,
    )

@router.patch("/{backlog_item_id}")
def edit_backlog(
    *,
    session: SessionDeps,
    backlog_item_id: uuid.UUID,
    backlog_update: BacklogUpdate,
):
    return update_backlog(
        session=session,
        backlog_item_id=backlog_item_id,
        backlog_update=backlog_update,
    )

@router.delete("/{backlog_item_id}")
def remove_backlog(
    *,
    session: SessionDeps,
    backlog_item_id: uuid.UUID,
):
    return delete_backlog(
        session=session,
        backlog_item_id=backlog_item_id,
    )