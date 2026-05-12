from sqlmodel import SQLModel, Session, create_engine, select

from app import crud
from app.core.config import settings
from app.models import User, UserCreate
  

# engine = create_engine(str(settings.SQLITE_DATABASE_URI()))
engine = create_engine(str(settings.SQLITE_DATABASE_URI()))


def init_db(session: Session):
    SQLModel.metadata.create_all(engine)

    user = session.exec(
        select(User).where(User.email == settings.FIRST_SUPERUSER_EMAIL)
    ).first()
    if not user:
        user_in = UserCreate(
            email=settings.FIRST_SUPERUSER_EMAIL,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            is_superuser=True,
        )
    user = crud.create_user(session=session, user_create=user_in)

if __name__ == "__main__":
    with Session(engine) as session:
        init_db(session)