from fastapi import APIRouter
from sqlmodel import Session, select

from models import Backlog_Item, Feature, Story, Task
from utils.database import engine

router = APIRouter()


@router.get("/dashboard/stats")
def get_dashboard_stats():

    with Session(engine) as session:

        total_backlogs = len(
            session.exec(select(Backlog_Item)).all()
        )

        total_features = len(
            session.exec(select(Feature)).all()
        )

        total_stories = len(
            session.exec(select(Story)).all()
        )

        total_tasks = len(
            session.exec(select(Task)).all()
        )

        pending_tasks = len(
            session.exec(
                select(Task).where(Task.status == "Pending")
            ).all()
        )

        return {
            "total_backlogs": total_backlogs,
            "total_features": total_features,
            "total_stories": total_stories,
            "total_tasks": total_tasks,
            "pending_tasks": pending_tasks
        }