from sqlmodel import Session, select
from app.models import Role, RoleCreate, User_Role, UserCreate, User
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


def create_role(*, session: Session, role_create: RoleCreate) -> Role:
    db_obj = Role.model_validate(role_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def assign_user_role(*, session: Session, email: str, role_name: str) -> User_Role:
    user = session.exec(select(User).where(User.email == email)).first()
    role = session.exec(select(Role).where(Role.role_name == role_name)).first()

    if not user:
        raise Exception("User doesn't exist")
    if not role:
        raise Exception("Role doesn't exist")

    user_role = User_Role(user_id=user.user_id, role_id=role.role_id)

    session.add(user_role)
    session.commit()
    session.refresh(user_role)
    return user_role
