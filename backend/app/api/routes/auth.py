from fastapi import APIRouter, HTTPException, status, Depends
from app.core.security import hash_password, verify_password, create_access_token
from app.core.logging import get_logger
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, TokenOut, UserOut
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])
logger = get_logger(__name__)


@router.post("/signup", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserCreate):
    if await User.find_one(User.email == payload.email):
        logger.warning("Signup attempt with existing email: %s", payload.email)
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=payload.email,
        name=payload.name,
        hashed_password=hash_password(payload.password),
    )
    await user.insert()
    logger.info("New user created: %s", payload.email)
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
async def login(payload: UserLogin):
    user = await User.find_one(User.email == payload.email)
    if not user or not verify_password(payload.password, user.hashed_password):
        logger.warning("Failed login attempt for: %s", payload.email)
        raise HTTPException(status_code=401, detail="Invalid credentials")
    logger.info("User logged in: %s", payload.email)
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return current_user
