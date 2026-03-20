"""
Migration script to add pricing columns to providers table.
This script adds weekly_price and monthly_price columns to the Provider model.

Run this after updating the models.py file with the new pricing fields.
"""

import sys
import os

# Add parent directory to path so we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.db import engine

def upgrade():
    """Add pricing columns to providers table."""
    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='providers' AND column_name IN ('weekly_price', 'monthly_price')
        """))
        existing_columns = [row[0] for row in result]
        
        if 'weekly_price' not in existing_columns:
            print("Adding weekly_price column...")
            conn.execute(text("""
                ALTER TABLE providers 
                ADD COLUMN weekly_price NUMERIC(10, 2) NOT NULL DEFAULT 899
            """))
            conn.commit()
            print("✓ weekly_price column added")
        
        if 'monthly_price' not in existing_columns:
            print("Adding monthly_price column...")
            conn.execute(text("""
                ALTER TABLE providers 
                ADD COLUMN monthly_price NUMERIC(10, 2) NOT NULL DEFAULT 3299
            """))
            conn.commit()
            print("✓ monthly_price column added")

if __name__ == "__main__":
    try:
        upgrade()
        print("\n✓ Migration completed successfully!")
    except Exception as e:
        print(f"\n✗ Migration failed: {e}")
