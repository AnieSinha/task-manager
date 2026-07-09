import uuid
from fastapi import APIRouter, HTTPException

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    Project,
    ProjectCreate,
    ProjectCreatedBy,
    ProjectPublic,
    ProjectUpdate,
)
import app.crud as crud

router_projects = APIRouter(prefix="/projects", tags=["projects"])


def _project_public(item: Project, session) -> ProjectPublic:
    from app.models import User

    creator = session.get(User, item.created_by)

    return ProjectPublic(
        project_id=item.project_id,
        title=item.title,
        description=item.description,
        status=item.status,
        created_by=ProjectCreatedBy(
            user_id=item.created_by,
            name=creator.name if creator else None,
        ),
        created_at=item.created_at,
    )


@router_projects.get("", response_model=dict)
def list_projects(
    session: SessionDep,
    current_user: CurrentUser,
    status: str | None = None,
    created_by: uuid.UUID | None = None,
    order_by: str = "created_at",
    direction: str = "desc",
    limit: int = 25,
    offset: int = 0,
):
    items, total = crud.get_projects(
        session=session,
        limit=limit,
        offset=offset,
        status=status,
        created_by=created_by,
        order_by=order_by,
        direction=direction,
    )

    return {
        "data": [_project_public(i, session) for i in items],
        "total": total,
        "limit": limit,
        "offset": offset,
    }


@router_projects.post("", status_code=201, response_model=ProjectPublic)
def create_project(
    body: ProjectCreate,
    session: SessionDep,
    current_user: CurrentUser,
):
    project = crud.create_project(
        session=session,
        data=body,
        created_by=current_user.user_id,
    )

    return _project_public(project, session)


@router_projects.get("/{project_id}", response_model=ProjectPublic)
def get_project(
    project_id: uuid.UUID,
    session: SessionDep,
    _: CurrentUser,
):
    project = session.get(Project, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return _project_public(project, session)


@router_projects.patch("/{project_id}", response_model=ProjectPublic)
def patch_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    session: SessionDep,
    _: CurrentUser,
):
    project = session.get(Project, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updated = crud.update_project(
        session=session,
        project=project,
        data=body,
    )

    return _project_public(updated, session)


@router_projects.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: uuid.UUID,
    session: SessionDep,
    _: CurrentUser,
):
    project = session.get(Project, project_id)

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    crud.delete_project(
        session=session,
        project=project,
    )