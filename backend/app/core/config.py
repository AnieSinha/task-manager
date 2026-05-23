from os import environ
from pathlib import Path

from pydantic import MySQLDsn
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


class Settings:
    def __init__(self):
        self.MYSQL_USER = environ["MYSQL_USER"]
        self.MYSQL_PASSWORD = environ["MYSQL_PASSWORD"]
        self.MYSQL_SERVER = environ["MYSQL_SERVER"]
        self.MYSQL_PORT = int(environ["MYSQL_PORT"])
        self.MYSQL_DB = environ["MYSQL_DB"]

        self.FIRST_SUPERUSER_EMAIL = environ["FIRST_SUPERUSER_EMAIL"]
        self.FIRST_SUPERUSER_PASSWORD = environ["FIRST_SUPERUSER_PASSWORD"]

        self.SECRET_KEY = environ["SECRET_KEY"]

    def MYSQL_DATABASE_URI(self) -> MySQLDsn:
        return MySQLDsn.build(
            scheme="mysql+pymysql",
            username=self.MYSQL_USER,
            password=self.MYSQL_PASSWORD,
            host=self.MYSQL_SERVER,
            port=self.MYSQL_PORT,
            path=self.MYSQL_DB,
        )

    def SQLITE_DATABASE_URI(self) -> str:
        return "sqlite:///database.db"

    def cors_origins(self) -> list[str]:
        return ["*"]


settings = Settings()