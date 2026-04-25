"""
Migration script to add provider food category and dish-level veg/nonveg tags.

What it does:
1) Adds providers.provider_food_category (pure_veg|mixed)
2) Adds menu.dish_items JSONB
3) Backfills provider categories from existing menu data (with deterministic fallback)
4) Backfills menu.dish_items from existing dishes arrays
"""

from __future__ import annotations

import json
import os
import random
import re
import sys

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text

from app.db import engine


NON_VEG_KEYWORDS = {
    "chicken",
    "mutton",
    "fish",
    "prawn",
    "prawns",
    "egg",
    "eggs",
    "meat",
    "keema",
    "biryani",
}

VEG_KEYWORDS = {
    "paneer",
    "dal",
    "rajma",
    "chole",
    "chana",
    "veg",
    "vegetable",
    "aloo",
    "palak",
    "kadhi",
    "kofta",
    "mushroom",
    "soya",
    "tofu",
    "salad",
}


def _contains_keyword(text_value: str, keywords: set[str]) -> bool:
    normalized = re.sub(r"\s+", " ", text_value.strip().lower())
    return any(keyword in normalized for keyword in keywords)


def _guess_provider_category(dishes_text: str, rng: random.Random) -> str:
    if _contains_keyword(dishes_text, NON_VEG_KEYWORDS):
        return "mixed"

    if _contains_keyword(dishes_text, VEG_KEYWORDS):
        # Keep some mixed providers in seeded/demo data for better UX testing.
        return "pure_veg" if rng.random() < 0.75 else "mixed"

    # Unknown content: deterministic random fallback.
    return "pure_veg" if rng.random() < 0.5 else "mixed"


def _guess_dish_food_type(dish_name: str, provider_category: str, rng: random.Random) -> str:
    name = str(dish_name or "").strip()
    if not name:
        return "veg"

    if provider_category == "pure_veg":
        return "veg"

    if _contains_keyword(name, NON_VEG_KEYWORDS):
        return "nonveg"

    if _contains_keyword(name, VEG_KEYWORDS):
        return "veg"

    return "veg" if rng.random() < 0.8 else "nonveg"


def upgrade() -> None:
    rng = random.Random(20260426)

    with engine.connect() as conn:
        # 1) provider_food_category enum + column
        conn.execute(
            text(
                """
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'providerfoodcategory') THEN
                        CREATE TYPE providerfoodcategory AS ENUM ('pure_veg', 'mixed');
                    END IF;
                END $$;
                """
            )
        )

        provider_column_exists = conn.execute(
            text(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'providers' AND column_name = 'provider_food_category'
                """
            )
        ).scalar()

        if not provider_column_exists:
            print("Adding providers.provider_food_category column...")
            conn.execute(
                text(
                    """
                    ALTER TABLE providers
                    ADD COLUMN provider_food_category providerfoodcategory NOT NULL DEFAULT 'mixed'
                    """
                )
            )
            conn.execute(
                text(
                    """
                    CREATE INDEX IF NOT EXISTS idx_providers_food_category
                    ON providers(provider_food_category)
                    """
                )
            )

        # 2) menu.dish_items column
        dish_items_exists = conn.execute(
            text(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'menu' AND column_name = 'dish_items'
                """
            )
        ).scalar()

        if not dish_items_exists:
            print("Adding menu.dish_items column...")
            conn.execute(
                text(
                    """
                    ALTER TABLE menu
                    ADD COLUMN dish_items JSONB NOT NULL DEFAULT '[]'::jsonb
                    """
                )
            )

        # 3) Backfill provider categories using existing menu rows.
        providers = conn.execute(
            text(
                """
                SELECT p.provider_id,
                       COALESCE(string_agg(dish.value, ' '), '') AS dishes_text
                FROM providers p
                LEFT JOIN menu m ON m.provider_id = p.provider_id
                LEFT JOIN LATERAL jsonb_array_elements_text(COALESCE(m.dishes, '[]'::jsonb)) AS dish(value) ON TRUE
                GROUP BY p.provider_id
                ORDER BY p.provider_id
                """
            )
        ).fetchall()

        for provider in providers:
            category = _guess_provider_category(provider.dishes_text or "", rng)
            conn.execute(
                text(
                    """
                    UPDATE providers
                    SET provider_food_category = :category
                    WHERE provider_id = :provider_id
                    """
                ),
                {"category": category, "provider_id": provider.provider_id},
            )

        # 4) Backfill menu.dish_items from existing dishes arrays.
        menu_rows = conn.execute(
            text(
                """
                SELECT m.menu_id,
                       m.dishes,
                       m.dish_items,
                       p.provider_food_category::text AS provider_food_category
                FROM menu m
                JOIN providers p ON p.provider_id = m.provider_id
                ORDER BY m.menu_id
                """
            )
        ).fetchall()

        for row in menu_rows:
            if isinstance(row.dish_items, list) and row.dish_items:
                continue

            dishes = row.dishes if isinstance(row.dishes, list) else []
            dish_items = [
                {
                    "name": str(dish).strip(),
                    "food_type": _guess_dish_food_type(str(dish), row.provider_food_category, rng),
                }
                for dish in dishes
                if str(dish).strip()
            ]

            conn.execute(
                text(
                    """
                    UPDATE menu
                    SET dish_items = CAST(:dish_items AS jsonb)
                    WHERE menu_id = :menu_id
                    """
                ),
                {"dish_items": json.dumps(dish_items), "menu_id": row.menu_id},
            )

        conn.commit()


if __name__ == "__main__":
    try:
        upgrade()
        print("\n✓ Migration completed successfully!")
    except Exception as exc:
        print(f"\n✗ Migration failed: {exc}")
