from __future__ import annotations

from pathlib import Path
import sys

from sqlalchemy import inspect, text

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db import engine


USER_COLUMNS = {
    "location_text": "VARCHAR(255)",
    "place_id": "VARCHAR(255)",
    "current_latitude": "NUMERIC(9, 6)",
    "current_longitude": "NUMERIC(9, 6)",
}

PROVIDER_COLUMNS = {
    "service_address_text": "VARCHAR(255)",
    "service_place_id": "VARCHAR(255)",
    "service_latitude": "NUMERIC(9, 6)",
    "service_longitude": "NUMERIC(9, 6)",
    "service_radius_km": "NUMERIC(6, 2)",
}

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_users_geo_coords ON users (current_latitude, current_longitude)",
    "CREATE INDEX IF NOT EXISTS idx_users_place_id ON users (place_id)",
    "CREATE INDEX IF NOT EXISTS idx_providers_geo_coords ON providers (service_latitude, service_longitude)",
    "CREATE INDEX IF NOT EXISTS idx_providers_service_place_id ON providers (service_place_id)",
]


def ensure_columns(table_name: str, definitions: dict[str, str]) -> None:
    inspector = inspect(engine)
    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
    with engine.begin() as connection:
        for column_name, sql_type in definitions.items():
            if column_name in existing_columns:
                continue
            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {sql_type}"))


def ensure_indexes() -> None:
    with engine.begin() as connection:
        for statement in INDEX_STATEMENTS:
            connection.execute(text(statement))


def main() -> None:
    ensure_columns("users", USER_COLUMNS)
    ensure_columns("providers", PROVIDER_COLUMNS)
    ensure_indexes()
    print("Geo columns and indexes are ready.")


if __name__ == "__main__":
    main()
