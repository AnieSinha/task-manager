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
class FeatureUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None


@router.get("/feature/{feature_id}")
def get_feature(feature_id: str):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Feature, uuid.UUID(feature_id))
        if not item:
            raise HTTPException(status_code=404, detail="Feature not found")
        return item


@router.patch("/feature/{feature_id}")
def update_feature(feature_id: str, payload: FeatureUpdateRequest, payload_user=Depends(verify_token)):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Feature, uuid.UUID(feature_id))
        if not item:
            raise HTTPException(status_code=404, detail="Feature not found")
        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)
        session.add(item)
        session.commit()
        session.refresh(item)
        return item


@router.delete("/feature/{feature_id}")
def delete_feature(feature_id: str, payload_user=Depends(verify_token)):
    from fastapi import HTTPException
    with Session(engine) as session:
        item = session.get(Feature, uuid.UUID(feature_id))
        if not item:
            raise HTTPException(status_code=404, detail="Feature not found")
        session.delete(item)
        session.commit()
        return {"message": "Feature deleted"}