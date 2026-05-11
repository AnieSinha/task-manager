from sqlmodel import create_engine

DATABASE_URL = "mysql+pymysql://root:9523511173@localhost/task_manager"

engine = create_engine(DATABASE_URL)

def get_session():
    return Session(engine)

print("Database Connected")