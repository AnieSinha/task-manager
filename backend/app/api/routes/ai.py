import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep, is_developer_only
from app.core.ai import AIError, call_llm, extract_json, is_ai_configured
from app.models import (
    Backlog_Item,
    BacklogCreate,
    Feature,
    FeatureCreate,
    Project,
    Story,
    StoryCreate,
    Task,
    TaskCreate,
)
from app import crud

router_ai = APIRouter(prefix="/ai", tags=["ai"])


# ---------------------------------------------------------------------------
# Project summary
# ---------------------------------------------------------------------------


class SummaryResponse(BaseModel):
    summary: str
    ai_generated: bool


@router_ai.post("/projects/{project_id}/summary", response_model=SummaryResponse)
def summarize_project(project_id: uuid.UUID, session: SessionDep, _: CurrentUser):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    backlogs = session.exec(
        select(Backlog_Item).where(Backlog_Item.project_id == project_id)
    ).all()
    backlog_ids = [b.backlog_item_id for b in backlogs]

    features = (
        session.exec(
            select(Feature).where(Feature.backlog_item_id.in_(backlog_ids))
        ).all()
        if backlog_ids
        else []
    )
    feature_ids = [f.feature_id for f in features]

    stories = (
        session.exec(select(Story).where(Story.feature_id.in_(feature_ids))).all()
        if feature_ids
        else []
    )
    story_ids = [s.story_id for s in stories]

    tasks = (
        session.exec(select(Task).where(Task.story_id.in_(story_ids))).all()
        if story_ids
        else []
    )

    def counts(items):
        return {
            "total": len(items),
            "to_do": sum(1 for i in items if i.status == "to-do"),
            "in_progress": sum(1 for i in items if i.status == "in-progress"),
            "completed": sum(1 for i in items if i.status == "completed"),
        }

    b_counts, f_counts, s_counts, t_counts = (
        counts(backlogs),
        counts(features),
        counts(stories),
        counts(tasks),
    )
    high_priority_open = [
        t for t in tasks if t.priority == "high" and t.status != "completed"
    ]

    if is_ai_configured():
        try:
            system_prompt = (
                "You are a concise, plain-spoken project status reporter for a "
                "software team. Given raw counts of backlog items, features, "
                "stories, and tasks (each broken down by status), write a short "
                "(4-6 sentence) status summary. Mention overall completion, call "
                "out anything at risk (open high-priority tasks, or a category "
                "that's mostly still to-do), and end with a one-line verdict "
                "(on track / needs attention / at risk). Plain text only, no "
                "markdown, no headers."
            )
            user_prompt = (
                f"Project: {project.title}\n"
                f"Description: {project.description}\n\n"
                f"Backlogs: {b_counts}\n"
                f"Features: {f_counts}\n"
                f"Stories: {s_counts}\n"
                f"Tasks: {t_counts}\n"
                f"Open high-priority tasks: {len(high_priority_open)} "
                f"({[t.title for t in high_priority_open[:5]]})\n"
            )
            text = call_llm(system_prompt, user_prompt, max_tokens=400)
            return SummaryResponse(summary=text, ai_generated=True)
        except AIError:
            pass  # fall through to the deterministic summary below

    # Deterministic fallback — no AI configured, or the AI call failed.
    def pct(c):
        return round(100 * c["completed"] / c["total"]) if c["total"] else 0

    parts = [
        f"{project.title} has {b_counts['total']} backlog item(s), "
        f"{f_counts['total']} feature(s), {s_counts['total']} stor(y/ies), and "
        f"{t_counts['total']} task(s).",
        f"Features are {pct(f_counts)}% complete, stories {pct(s_counts)}% complete, "
        f"tasks {pct(t_counts)}% complete.",
    ]
    if high_priority_open:
        parts.append(
            f"{len(high_priority_open)} high-priority task(s) are still open — "
            "worth checking on."
        )
    verdict = (
        "On track."
        if pct(t_counts) >= 60 and not high_priority_open
        else "Needs attention."
    )
    parts.append(verdict)

    return SummaryResponse(summary=" ".join(parts), ai_generated=False)


# ---------------------------------------------------------------------------
# Roadmap generation (preview) + commit
# ---------------------------------------------------------------------------


class RoadmapRequest(BaseModel):
    prompt: str


class RoadmapResponse(BaseModel):
    tree: dict
    ai_generated: bool


def _mock_roadmap(prompt: str) -> dict:
    """Deterministic, template-based roadmap so the feature works with no API key."""
    base = prompt.strip().rstrip(".") or "New initiative"
    return {
        "backlogs": [
            {
                "title": f"{base} — Core functionality",
                "description": f"Primary backlog covering the core work for: {base}.",
                "priority": "high",
                "features": [
                    {
                        "title": "Backend implementation",
                        "description": f"Server-side work needed for {base}.",
                        "stories": [
                            {
                                "title": "Design data model & API",
                                "description": "Define schema and endpoints.",
                                "tasks": [
                                    {
                                        "title": "Design database schema",
                                        "description": "Model the core entities.",
                                        "priority": "high",
                                    },
                                    {
                                        "title": "Implement API endpoints",
                                        "description": "CRUD endpoints for the new feature.",
                                        "priority": "medium",
                                    },
                                ],
                            }
                        ],
                    },
                    {
                        "title": "Frontend implementation",
                        "description": f"Client-side work needed for {base}.",
                        "stories": [
                            {
                                "title": "Build core UI",
                                "description": "Primary user-facing screens.",
                                "tasks": [
                                    {
                                        "title": "Build main UI components",
                                        "description": "Implement the primary screens.",
                                        "priority": "medium",
                                    },
                                    {
                                        "title": "Wire UI to API",
                                        "description": "Connect frontend to backend endpoints.",
                                        "priority": "medium",
                                    },
                                ],
                            }
                        ],
                    },
                ],
            },
            {
                "title": f"{base} — Testing & polish",
                "description": f"Hardening and quality work for: {base}.",
                "priority": "medium",
                "features": [
                    {
                        "title": "QA & edge cases",
                        "description": "Testing and bug-fixing.",
                        "stories": [
                            {
                                "title": "Write tests and fix issues",
                                "description": "Cover the main flows with tests.",
                                "tasks": [
                                    {
                                        "title": "Write automated tests",
                                        "description": "Cover core functionality.",
                                        "priority": "low",
                                    }
                                ],
                            }
                        ],
                    }
                ],
            },
        ]
    }


@router_ai.post("/projects/{project_id}/roadmap", response_model=RoadmapResponse)
def generate_roadmap(
    project_id: uuid.UUID, body: RoadmapRequest, session: SessionDep, _: CurrentUser
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if not body.prompt or not body.prompt.strip():
        raise HTTPException(status_code=422, detail="Prompt cannot be empty")

    if is_ai_configured():
        try:
            system_prompt = (
                "You are a software project planner. Given a one-sentence "
                "description of an initiative, propose a complete work "
                "breakdown as JSON, and ONLY JSON — no markdown fences, no "
                "prose before or after. The shape must be exactly:\n"
                '{"backlogs": [{"title": str, "description": str, '
                '"priority": "low"|"medium"|"high", "features": [{"title": str, '
                '"description": str, "stories": [{"title": str, '
                '"description": str, "tasks": [{"title": str, "description": '
                'str, "priority": "low"|"medium"|"high"}]}]}]}]}\n'
                "Propose 2-3 backlogs, each with 1-3 features, each with 1-2 "
                "stories, each with 2-4 tasks. Keep titles short and concrete."
            )
            text = call_llm(system_prompt, body.prompt.strip(), max_tokens=3000)
            tree = extract_json(text)
            return RoadmapResponse(tree=tree, ai_generated=True)
        except (AIError, ValueError, KeyError):
            pass  # fall through to the template below

    return RoadmapResponse(tree=_mock_roadmap(body.prompt), ai_generated=False)


class CommitRequest(BaseModel):
    tree: dict


class CommitResponse(BaseModel):
    backlogs_created: int
    features_created: int
    stories_created: int
    tasks_created: int


@router_ai.post("/projects/{project_id}/roadmap/commit", response_model=CommitResponse)
def commit_roadmap(
    project_id: uuid.UUID,
    body: CommitRequest,
    session: SessionDep,
    current_user: CurrentUser,
):
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Bulk-creating a roadmap is equivalent to creating many backlogs/features/
    # stories/tasks — keep it consistent with the same rule QuickCreate uses.
    if is_developer_only(current_user, session):
        raise HTTPException(
            status_code=403, detail="Developers cannot create roadmap items."
        )

    default_due = (datetime.now(timezone.utc) + timedelta(days=14)).strftime(
        "%Y-%m-%d"
    )

    counts = {"backlogs": 0, "features": 0, "stories": 0, "tasks": 0}

    for b in body.tree.get("backlogs", []):
        backlog = crud.create_backlog(
            session=session,
            data=BacklogCreate(
                project_id=project_id,
                title=b.get("title", "Untitled backlog"),
                description=b.get("description", ""),
                priority=b.get("priority", "medium"),
                status="to-do",
            ),
            created_by=current_user.user_id,
        )
        counts["backlogs"] += 1

        for f in b.get("features", []):
            feature = crud.create_feature(
                session=session,
                data=FeatureCreate(
                    backlog_item_id=backlog.backlog_item_id,
                    title=f.get("title", "Untitled feature"),
                    description=f.get("description", ""),
                    status="to-do",
                ),
            )
            counts["features"] += 1

            for s in f.get("stories", []):
                story = crud.create_story(
                    session=session,
                    data=StoryCreate(
                        feature_id=feature.feature_id,
                        title=s.get("title", "Untitled story"),
                        description=s.get("description", ""),
                        status="to-do",
                    ),
                )
                counts["stories"] += 1

                for t in s.get("tasks", []):
                    crud.create_task(
                        session=session,
                        data=TaskCreate(
                            story_id=story.story_id,
                            title=t.get("title", "Untitled task"),
                            description=t.get("description", ""),
                            status="to-do",
                            priority=t.get("priority", "medium"),
                            due_date=default_due,
                        ),
                    )
                    counts["tasks"] += 1

    return CommitResponse(
        backlogs_created=counts["backlogs"],
        features_created=counts["features"],
        stories_created=counts["stories"],
        tasks_created=counts["tasks"],
    )
