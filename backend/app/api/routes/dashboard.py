from fastapi import APIRouter, Depends
from app.models.task import Task
from app.models.project import Project
from app.models.user import User
from app.api.deps import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardOut(BaseModel):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    by_priority: dict[str, int]
    by_project: list[dict]


@router.get("/", response_model=DashboardOut)
async def get_dashboard(current_user: User = Depends(get_current_user)):
    projects = await Project.find(Project.owner_id == str(current_user.id)).to_list()

    if not projects:
        return DashboardOut(
            total_tasks=0, completed_tasks=0, pending_tasks=0,
            in_progress_tasks=0,
            by_priority={"low": 0, "medium": 0, "high": 0},
            by_project=[]
        )

    project_ids = [str(p.id) for p in projects]
    tasks = await Task.find({"project_id": {"$in": project_ids}}).to_list()

    total = len(tasks)
    completed = sum(1 for t in tasks if t.status == "done")
    in_progress = sum(1 for t in tasks if t.status == "in_progress")
    pending = sum(1 for t in tasks if t.status == "backlog")

    by_priority = {"low": 0, "medium": 0, "high": 0}
    for t in tasks:
        if t.priority in by_priority:
            by_priority[t.priority] += 1

    by_project = []
    for p in projects:
        p_tasks = [t for t in tasks if t.project_id == str(p.id)]
        by_project.append({
            "id": str(p.id),
            "name": p.name,
            "color": p.color,
            "total": len(p_tasks),
            "done": sum(1 for t in p_tasks if t.status == "done"),
        })

    return DashboardOut(
        total_tasks=total,
        completed_tasks=completed,
        pending_tasks=pending,
        in_progress_tasks=in_progress,
        by_priority=by_priority,
        by_project=by_project,
    )
