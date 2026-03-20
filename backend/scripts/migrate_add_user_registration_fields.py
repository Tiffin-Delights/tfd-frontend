"""
Migration script to add user registration fields for phone and delivery address.

Run this script after updating models.py.
"""

import os
import sys

from sqlalchemy import text

# Add parent directory to path so app imports work when script is run directly.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import engine


def upgrade() -> None:
    with engine.connect() as conn:
        result = conn.execute(
            text(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name='users' AND column_name IN ('phone', 'delivery_address')
                """
            )
        )
        existing_columns = {row[0] for row in result}

        if "phone" not in existing_columns:
            print("Adding phone column...")
            conn.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN phone VARCHAR(20)
                    """
                )
            )
            conn.commit()
            print("OK: phone column added")

        if "delivery_address" not in existing_columns:
            print("Adding delivery_address column...")
            conn.execute(
                text(
                    """
                    ALTER TABLE users
                    ADD COLUMN delivery_address TEXT
                    """
                )
            )
            conn.commit()
            print("OK: delivery_address column added")

        print("Ensuring unique index on phone...")
        conn.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS ux_users_phone_not_null
                ON users (phone)
                WHERE phone IS NOT NULL
                """
            )
        )
        conn.commit()
        print("OK: unique phone index ensured")


if __name__ == "__main__":
    try:
        upgrade()
        print("\nOK: user registration migration completed")
    except Exception as exc:
        print(f"\nERROR: migration failed: {exc}")
