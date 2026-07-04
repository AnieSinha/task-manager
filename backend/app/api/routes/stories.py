# =============================================================================
# app/api/routes/stories.py
# =============================================================================
import uuid

from fastapi import APIRouter, HTTPException

import app.crud as crud
from app.api.deps import SessionDep, require_permission
from app.core.permissions import Permission
from app.models import (
    Feature,
    Story,
    StoryCreate,
    StoryPublic,
    StoryUpdate,
    Task,
)

router_stories = APIRouter(prefix="/stories", tags=["stories"])


def _story_public(s: Story, session) -> StoryPublic:
    feat = session.get(Feature, s.feature_id)
    return StoryPublic(
        story_id=s.story_id,  # type: ignore[arg-type]
        feature_id=s.feature_id,
        feature_title=feat.title if feat else None,
        title=s.title,
        description=s.description,
        status=s.status,
    )


@router_stories.get("", response_model=dict)
def list_stories(
    session: SessionDep,
    _=require_permission(Permission.STORY_VIEW),
    feature_id: uuid.UUID | None = None,
    status: str | None = None,
    limit: int = 25,
    offset: int = 0,
):
    stories, total = crud.get_stories(
        session=session,
        limit=limit,
        offset=offset,
        feature_id=feature_id,
        status=status,
    )

    return {
        "data": [_story_public(s, session) for s in stories],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router_stories.post("", status_code=201, response_model=StoryPublic)
def create_story(
    body: StoryCreate,
    session: SessionDep,
    _=require_permission(Permission.STORY_CREATE),
):
    if not session.get(Feature, body.feature_id):
        raise HTTPException(status_code=404, detail="Feature not found")

    story = crud.create_story(session=session, data=body)
    return _story_public(story, session)


@router_stories.get("/{story_id}", response_model=StoryPublic)
def get_story(
    story_id: uuid.UUID,
    session: SessionDep,
    _=require_permission(Permission.STORY_VIEW),
):
    story = session.get(Story, story_id)

    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    return _story_public(story, session)


@router_stories.patch("/{story_id}", response_model=StoryPublic)
def patch_story(
    story_id: uuid.UUID,
    body: StoryUpdate,
    session: SessionDep,
    _=require_permission(Permission.STORY_UPDATE),
):
    story = session.get(Story, story_id)

    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    updated = crud.update_story(session=session, story=story, data=body)
    return _story_public(updated, session)


@router_stories.delete("/{story_id}", status_code=204)
def delete_story(
    story_id: uuid.UUID,
    session: SessionDep,
    _=require_permission(Permission.STORY_DELETE),
):
    story = session.get(Story, story_id)

    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    child = session.exec(
        __import__("sqlmodel").select(Task).where(Task.story_id == story_id)
    ).first()

    if child:
        raise HTTPException(
            status_code=409,
            detail="Story has dependent tasks",
        )

    crud.delete_story(session=session, story=story)


@router_stories.get("/{story_id}/tasks", response_model=dict)
def list_tasks_under_story(
    story_id: uuid.UUID,
    session: SessionDep,
    _=require_permission(Permission.TASK_VIEW),
    status: str | None = None,
    priority: str | None = None,
    assigned_to: uuid.UUID | None = None,
    limit: int = 25,
    offset: int = 0,
):
    story = session.get(Story, story_id)

    if not story:
        raise HTTPException(status_code=404, detail="Story not found")

    tasks, total = crud.get_tasks(
        session=session,
        limit=limit,
        offset=offset,
        story_id=story_id,
        parent_task_id=None,
        status=status,
        priority=priority,
        assigned_to=assigned_to,
        due_before=None,
        due_after=None,
        order_by="due_date",
        direction="asc",
    )

    top_level = [t for t in tasks if t.parent_task_id is None]

    return {
        "data": top_level,
        "total": len(top_level),
        "limit": limit,
        "offset": offset,
    }
