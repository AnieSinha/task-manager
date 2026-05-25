from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session
import uuid

from models import Story
from utils.database import engine
from middleware.auth_middleware import verify_token

router = APIRouter()


class StoryRequest(BaseModel):
    feature_id: str
    title: str
    description: str


@router.post("/story")
def create_story(
    story: StoryRequest,
    payload=Depends(verify_token)
):

    new_story = Story(
        story_id=uuid.uuid4(),
        feature_id=uuid.UUID(story.feature_id),
        title=story.title,
        description=story.description
    )

    with Session(engine) as session:
        session.add(new_story)
        session.commit()

    return {
        "message": "Story created successfully"
    }