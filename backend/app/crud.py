import json
from app.core.cache import redis_client
import uuid
from typing import List

from sqlmodel import Session, select
from app.models import (
    UserCreate,
    User,

    Backlog_Item,
    BacklogCreate,
    BacklogUpdate,
)
from app.core.security import get_password_hash, verify_password


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


DUMMY_HASH = "$argon2id$v=19$m=65536,t=3,p=4$8s6yDA/+jo+2cUyX7Re37w$KTa+uNeMplVI+F7bAymYiotxgmzj7UXA8bpg0/cOMiA"


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        # Prevent timing attacks by running verification even when user doesn't exist
        verify_password(password, DUMMY_HASH)
        return None
    verified, updated_password_hash = verify_password(password, db_user.hashed_password)
    if not verified:
        return None
    if updated_password_hash:
        db_user.hashed_password = updated_password_hash
        session.add(db_user)
        session.commit()
        session.refresh()
    return db_user

#create backlog item
def create_backlog(
    *,
    session: Session,
    backlog_create: BacklogCreate,
    user_id,
):
    backlog = Backlog_Item(
        created_by=user_id,
        title=backlog_create.title,
        description=backlog_create.description,
        priority=backlog_create.priority,
        status=backlog_create.status,
    )

    session.add(backlog)

    session.commit()

    session.refresh(backlog)

# Clear cached backlog list
    redis_client.delete("all_backlogs")

    return backlog

#get all backlog items
def get_backlogs(*, session: Session):

    cache_key = "all_backlogs"

    cached_data = redis_client.get(cache_key)

    if cached_data:
        print("CACHE HIT")
        return json.loads(cached_data)

    print("CACHE MISS")

    statement = select(Backlog_Item)

    backlogs = session.exec(statement).all()

    response = [item.model_dump(mode="json") for item in backlogs]

    redis_client.setex(
        cache_key,
        300,  # 5 minutes
        json.dumps(response)
    )

    return response
#get single backlog
def get_backlog_by_id(
    *,
    session: Session,
    backlog_item_id: uuid.UUID,
):

    cache_key = f"backlog:{backlog_item_id}"

    cached_data = redis_client.get(cache_key)

    if cached_data:
        print("SINGLE BACKLOG CACHE HIT")
        return json.loads(cached_data)

    print("SINGLE BACKLOG CACHE MISS")

    backlog = session.get(
        Backlog_Item,
        backlog_item_id,
    )

    if not backlog:
        return None

    response = backlog.model_dump(mode="json")

    redis_client.setex(
        cache_key,
        300,
        json.dumps(response)
    )

    return response
#update backlog
def update_backlog(
    *,
    session: Session,
    backlog_item_id: uuid.UUID,
    backlog_update: BacklogUpdate,
):
    backlog = session.get(
        Backlog_Item,
        backlog_item_id,
    )

    if not backlog:
        return None

    update_data = backlog_update.model_dump(
        exclude_unset=True
    )

    for key, value in update_data.items():
        setattr(backlog, key, value)

    session.add(backlog)

    session.commit()

    session.refresh(backlog)

    # Invalidate cache
    redis_client.delete("all_backlogs")
    redis_client.delete(f"backlog:{backlog_item_id}")

    return backlog

#delete backlog
def delete_backlog(
    *,
    session: Session,
    backlog_item_id: uuid.UUID,
):
    backlog = session.get(
        Backlog_Item,
        backlog_item_id,
    )

    if not backlog:
        return None

    session.delete(backlog)

    session.commit()

# Invalidate cache
    redis_client.delete("all_backlogs")
    redis_client.delete(f"backlog:{backlog_item_id}")

    return True
