from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
from beanie import PydanticObjectId
from app.models.task import Task
from app.models.project import Project
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate, TaskOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["tasks"])

VALID_STATUSES = {"backlog", "in_progress", "done"}
VALID_PRIORITIES = {"low", "medium", "high"}


def to_oid(id_str: str) -> PydanticObjectId:
    try:
        return PydanticObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid ID")


async def _get_project(project_id: str, user_id: str) -> Project:
    project = await Project.find_one(Project.id == to_oid(project_id), Project.owner_id == user_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


async def _enrich(task: Task) -> TaskOut:
    out = TaskOut.model_validate(task)
    if task.assignee_id:
        assignee = await User.get(to_oid(task.assignee_id))
        if assignee:
            from app.schemas.user import UserOut
            out.assignee = UserOut.model_validate(assignee)
    return out


@router.get("/", response_model=list[TaskOut])
async def list_tasks(project_id: str, current_user: User = Depends(get_current_user)):
    await _get_project(project_id, str(current_user.id))
    tasks = await Task.find(Task.project_id == project_id).to_list()
    return [await _enrich(t) for t in tasks]


@router.post("/", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(project_id: str, payload: TaskCreate, current_user: User = Depends(get_current_user)):
    await _get_project(project_id, str(current_user.id))
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {VALID_STATUSES}")
    if payload.priority not in VALID_PRIORITIES:
        raise HTTPException(status_code=422, detail=f"priority must be one of {VALID_PRIORITIES}")
    task = Task(**payload.model_dump(), project_id=project_id)
    await task.insert()
    return await _enrich(task)


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(project_id: str, task_id: str, payload: TaskUpdate, current_user: User = Depends(get_current_user)):
    await _get_project(project_id, str(current_user.id))
    task = await Task.find_one(Task.id == to_oid(task_id), Task.project_id == project_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    updates = payload.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail=f"status must be one of {VALID_STATUSES}")
    if "priority" in updates and updates["priority"] not in VALID_PRIORITIES:
        raise HTTPException(status_code=422, detail=f"priority must be one of {VALID_PRIORITIES}")
    updates["updated_at"] = datetime.utcnow()
    await task.set(updates)
    return await _enrich(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(project_id: str, task_id: str, current_user: User = Depends(get_current_user)):
    await _get_project(project_id, str(current_user.id))
    task = await Task.find_one(Task.id == to_oid(task_id), Task.project_id == project_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    await task.delete()
