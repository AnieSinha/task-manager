from datetime import datetime, timezone
import uuid
from pydantic import BaseModel, EmailStr
from sqlmodel import SQLModel, Field
from sqlalchemy import DateTime


def get_datetime_utc() -> datetime:
    return datetime.now(timezone.utc)


class UserBase(SQLModel):
    name: str | None = Field(default=None, max_length=255)
    email: EmailStr = Field(max_length=255)
    is_active: bool = True


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class User(UserBase, table=True):
    user_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    password_hash: str
    created_at: datetime | None = Field(
        default_factory=get_datetime_utc,
        sa_type=DateTime(timezone=True),  # type: ignore
    )


class Role(SQLModel, table=True):
    role_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    role_name: str
    description: str


class User_Role(SQLModel, table=True):
    user_id: uuid.UUID = Field(foreign_key="user.user_id", primary_key=True)
    role_id: uuid.UUID = Field(foreign_key="role.role_id", primary_key=True)
    timestamp: datetime


class Backlog_Item(SQLModel, table=True):
    backlog_item_id: uuid.UUID | None = Field(
        default_factory=uuid.uuid4, primary_key=True
    )
    created_by: uuid.UUID = Field(foreign_key="user.user_id")
    title: str
    description: str
    priority: str
    status: str
    created_at: datetime


class Feature(SQLModel, table=True):
    feature_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    backlog_item_id: uuid.UUID = Field(foreign_key="backlog_item.backlog_item_id")
    title: str
    description: str
    status: str


class Story(SQLModel, table=True):
    story_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    feature_id: uuid.UUID = Field(foreign_key="feature.feature_id")
    title: str
    description: str


class Task(SQLModel, table=True):
    task_id: uuid.UUID | None = Field(default_factory=uuid.uuid4, primary_key=True)
    story_id: uuid.UUID = Field(foreign_key="story.story_id")
    parent_task_id: uuid.UUID | None = Field(foreign_key="task.task_id")
    title: str
    description: str
    status: str
    priority: str
    due_date: datetime
    created_at: datetime
    updated_at: datetime


class Task_Assignments(SQLModel, table=True):
    task_assignment_id: uuid.UUID | None = Field(
        default_factory=uuid.uuid4, primary_key=True
    )
    task_id: uuid.UUID = Field(foreign_key="task.task_id")
    assigned_to: uuid.UUID = Field(foreign_key="user.user_id")
    assigned_by: uuid.UUID = Field(foreign_key="user.user_id")
    assigned_at: datetime
    reason: str


# Validation Models


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
