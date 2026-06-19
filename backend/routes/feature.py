from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlmodel import Session, select
import uuid

from models import Feature
from utils.database import engine
from middleware.auth_middleware import verify_token

router = APIRouter()


class FeatureRequest(BaseModel):
    backlog_item_id: str
    title: str
    description: str


@router.post("/feature")
def create_feature(
    feature: FeatureRequest,
    payload=Depends(verify_token)
):

    new_feature = Feature(
        feature_id=uuid.uuid4(),
        backlog_item_id=uuid.UUID(feature.backlog_item_id),
        title=feature.title,
        description=feature.description,
        status="Pending"
    )

    with Session(engine) as session:
        session.add(new_feature)
        session.commit()

    return {
        "message": "Feature created successfully"
    }

@router.get("/features")
def get_features(
    status: str = None,
    backlog_item_id: str = None
):

    with Session(engine) as session:

        statement = select(Feature)

        if status:
            statement = statement.where(Feature.status == status)

        if backlog_item_id:
            statement = statement.where(
                Feature.backlog_item_id == uuid.UUID(backlog_item_id)
            )

        features = session.exec(statement).all()

        return features