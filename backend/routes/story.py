from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
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

@router.get("/stories")
def get_stories(
    status: str = None,
    feature_id: str = None
):

    with Session(engine) as session:

        statement = select(Story)

        if status:
            statement = statement.where(Story.status == status)

        if feature_id:
            statement = statement.where(
                Story.feature_id == uuid.UUID(feature_id)
            )

        stories = session.exec(statement).all()

        return stories