from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
import uuid
from enum import Enum

from models import Story
from utils.database import engine
from middleware.auth_middleware import verify_token

router = APIRouter()


class StoryRequest(BaseModel):
    feature_id: str
    title: str
    description: str


# Enum for Swagger dropdown
class StatusEnum(str, Enum):
    pending = "Pending"
    in_progress = "In Progress"
    completed = "Completed"


@router.post("/story")
def create_story(
    story: StoryRequest,
    payload=Depends(verify_token)
):

    new_story = Story(
        story_id=uuid.uuid4(),
        feature_id=uuid.UUID(story.feature_id),
        title=story.title,
        description=story.description,
        status="Pending"     
    )

    with Session(engine) as session:
        session.add(new_story)
        session.commit()

    return {
        "message": "Story created successfully"
    }


@router.get("/stories")
def get_stories(
    status: StatusEnum = None,
    feature_id: str = None
):

    with Session(engine) as session:

        statement = select(Story)

        if status:
            statement = statement.where(
                Story.status == status
            )

        if feature_id:
            statement = statement.where(
                Story.feature_id == uuid.UUID(feature_id)
            )

        stories = session.exec(statement).all()

        return storiesclass
class StoryUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None


@router.get("/story/{story_id}")
def get_story(story_id: str):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Story, uuid.UUID(story_id))
        if not item:
            raise HTTPException(status_code=404, detail="Story not found")
        return item


@router.patch("/story/{story_id}")
def update_story(story_id: str, payload: StoryUpdateRequest, payload_user=Depends(verify_token)):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Story, uuid.UUID(story_id))
        if not item:
            raise HTTPException(status_code=404, detail="Story not found")
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        session.add(item)
        session.commit()
        session.refresh(item)
        return item


@router.delete("/story/{story_id}")
def delete_story(story_id: str, payload_user=Depends(verify_token)):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Story, uuid.UUID(story_id))
        if not item:
            raise HTTPException(status_code=404, detail="Story not found")
        session.delete(item)
        session.commit()
        return {"message": "Story deleted"}   