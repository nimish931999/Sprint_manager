from fastapi import APIRouter, HTTPException, status, Depends
from beanie import PydanticObjectId
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectOut
from app.api.deps import get_current_user
from app.core.logging import get_logger

router = APIRouter(prefix="/projects", tags=["projects"])
logger = get_logger(__name__)


def to_oid(id_str: str) -> PydanticObjectId:
    try:
        return PydanticObjectId(id_str)
    except Exception:
        raise HTTPException(status_code=404, detail="Invalid ID")


async def _to_out(project: Project) -> ProjectOut:
    task_count = await Task.find(Task.project_id == str(project.id)).count()
    data = ProjectOut.model_validate(project)
    data.task_count = task_count
    return data


@router.get("/", response_model=list[ProjectOut])
async def list_projects(current_user: User = Depends(get_current_user)):
    projects = await Project.find(Project.owner_id == str(current_user.id)).to_list()
    return [await _to_out(p) for p in projects]


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, current_user: User = Depends(get_current_user)):
    project = Project(**payload.model_dump(), owner_id=str(current_user.id))
    await project.insert()
    logger.info("Project created: '%s' by user %s", project.name, current_user.id)
    return await _to_out(project)


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    project = await Project.find_one(Project.id == to_oid(project_id), Project.owner_id == str(current_user.id))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return await _to_out(project)


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(project_id: str, payload: ProjectUpdate, current_user: User = Depends(get_current_user)):
    project = await Project.find_one(Project.id == to_oid(project_id), Project.owner_id == str(current_user.id))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await project.set(payload.model_dump(exclude_unset=True))
    return await _to_out(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(project_id: str, current_user: User = Depends(get_current_user)):
    project = await Project.find_one(Project.id == to_oid(project_id), Project.owner_id == str(current_user.id))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    await Task.find(Task.project_id == project_id).delete()
    await project.delete()
