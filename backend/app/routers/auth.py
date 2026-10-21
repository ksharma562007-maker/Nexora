import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, GoogleAuthRequest, UserOut, Token, UserUpdate, UserPasswordUpdate
from app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email or username already exists
    existing_email = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    existing_username = db.query(User).filter(User.username == user_in.username.strip()).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this username already exists."
        )

    new_user = User(
        email=user_in.email.lower().strip(),
        username=user_in.username.strip(),
        full_name=user_in.full_name.strip(),
        hashed_password=hash_password(user_in.password),
        avatar="avatar-1"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token({"sub": str(new_user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    identifier = login_data.email.strip()
    # Support login via email or username
    user = db.query(User).filter(
        (User.email == identifier.lower()) | (User.username == identifier)
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your email/username and password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user account is currently deactivated."
        )

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/google", response_model=Token)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    clean_email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == clean_email).first()

    if not user:
        # Create user account automatically from Google / Gmail login
        base_username = clean_email.split("@")[0].replace(".", "_")
        if len(base_username) < 3:
            base_username = f"user_{base_username}"
        username = base_username[:40]

        counter = 1
        while db.query(User).filter(User.username == username).first():
            username = f"{base_username[:35]}_{counter}"
            counter += 1

        random_pwd = secrets.token_urlsafe(32)
        display_name = payload.full_name.strip() if payload.full_name else clean_email.split("@")[0].title()

        user = User(
            email=clean_email,
            username=username,
            full_name=display_name,
            hashed_password=hash_password(random_pwd),
            avatar=payload.avatar or "avatar-1"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user account is currently deactivated."
        )

    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.full_name is not None:
        current_user.full_name = update_data.full_name.strip()
    if update_data.avatar is not None:
        current_user.avatar = update_data.avatar
    if update_data.daily_goal_minutes is not None:
        current_user.daily_goal_minutes = max(15, min(720, update_data.daily_goal_minutes))
    if update_data.pomodoro_focus_min is not None:
        current_user.pomodoro_focus_min = max(5, min(120, update_data.pomodoro_focus_min))
    if update_data.pomodoro_break_min is not None:
        current_user.pomodoro_break_min = max(1, min(60, update_data.pomodoro_break_min))
    if update_data.theme_preference is not None:
        current_user.theme_preference = update_data.theme_preference

    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/password")
def change_password(
    pwd_data: UserPasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(pwd_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password provided."
        )
    current_user.hashed_password = hash_password(pwd_data.new_password)
    db.commit()
    return {"message": "Password updated successfully."}
