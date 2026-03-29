from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings


class Base(DeclarativeBase):
    pass


database_url = settings.database_url
url = make_url(database_url)
engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _quote_postgres_identifier(identifier: str) -> str:
    return '"' + identifier.replace('"', '""') + '"'


def ensure_database_exists() -> None:
    if url.get_backend_name() != "postgresql":
        return

    # Only auto-create databases for local development.
    if url.host not in {None, "localhost", "127.0.0.1"}:
        return

    target_database = url.database
    if not target_database:
        raise ValueError("DATABASE_URL must include a database name.")

    maintenance_url = url.set(database="postgres")
    maintenance_engine = create_engine(
        maintenance_url,
        pool_pre_ping=True,
        isolation_level="AUTOCOMMIT",
    )

    try:
        with maintenance_engine.connect() as connection:
            database_exists = connection.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :database_name"),
                {"database_name": target_database},
            ).scalar()

            if database_exists:
                return

            connection.execute(text(f"CREATE DATABASE {_quote_postgres_identifier(target_database)}"))
    finally:
        maintenance_engine.dispose()


def init_db() -> None:
    import app.models  # noqa: F401

    ensure_database_exists()
    Base.metadata.create_all(bind=engine)
    ensure_feedback_rating_precision()


def ensure_feedback_rating_precision() -> None:
    if url.get_backend_name() != "postgresql":
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                """
                ALTER TABLE feedback
                ALTER COLUMN rating TYPE NUMERIC(2, 1)
                USING rating::numeric(2, 1)
                """
            )
        )
        connection.execute(
            text("ALTER TABLE feedback DROP CONSTRAINT IF EXISTS chk_feedback_rating_range")
        )
        connection.execute(
            text(
                """
                ALTER TABLE feedback
                ADD CONSTRAINT chk_feedback_rating_range
                CHECK (rating BETWEEN 1 AND 5 AND mod(rating * 10, 5) = 0)
                """
            )
        )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
