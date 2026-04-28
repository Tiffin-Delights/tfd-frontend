#!/usr/bin/env python3
"""
Database Initialization Script
Recreates all tables and populates with demo data in one command.
Designed for quick recovery when database trial resets or storage is lost.
"""

from __future__ import annotations

import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.db import engine, SessionLocal, init_db, Base
from sqlalchemy import inspect
from seed_mess_providers import seed_providers


def check_database_connection() -> bool:
    """Test database connection before proceeding."""
    try:
        with engine.connect() as conn:
            tables = inspect(engine).get_table_names()
            print("✓ Database connection successful")
            return True
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        return False


def create_all_tables() -> int:
    """Create all tables from SQLAlchemy models."""
    try:
        print("\n📋 Creating database tables...")
        init_db()
        
        # Count created tables
        inspector = inspect(engine)
        table_count = len(inspector.get_table_names())
        print(f"✓ Created {table_count} tables successfully")
        return table_count
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        return 0


def populate_demo_data() -> bool:
    """Populate database with demo data."""
    try:
        print("\n🌱 Populating demo data...")
        seed_providers()
        print("✓ Demo data populated successfully")
        return True
    except Exception as e:
        print(f"✗ Error populating demo data: {e}")
        return False


def verify_database() -> dict:
    """Verify all tables have data."""
    session = SessionLocal()
    try:
        from app.models import (
            User, Provider, MenuItem, Order, Subscription,
            Payment, Feedback, Wallet, WalletTransaction,
            SubscriptionMeal, ProviderPhoto
        )
        
        counts = {
            "users": session.query(User).count(),
            "providers": session.query(Provider).count(),
            "menu_items": session.query(MenuItem).count(),
            "orders": session.query(Order).count(),
            "subscriptions": session.query(Subscription).count(),
            "payments": session.query(Payment).count(),
            "feedback": session.query(Feedback).count(),
            "wallets": session.query(Wallet).count(),
            "wallet_transactions": session.query(WalletTransaction).count(),
            "subscription_meals": session.query(SubscriptionMeal).count(),
            "provider_photos": session.query(ProviderPhoto).count(),
        }
        return counts
    finally:
        session.close()


def print_verification_report(counts: dict):
    """Print verification report."""
    print("\n📊 Database Verification Report:")
    print("=" * 50)
    
    for table, count in counts.items():
        status = "✓" if count > 0 else "⚠"
        print(f"{status} {table.ljust(25)} : {count:>6} rows")
    
    total = sum(counts.values())
    print("=" * 50)
    print(f"Total: {total} rows across {len(counts)} tables")
    
    # Demo credentials
    print("\n🔑 Demo Credentials:")
    print("=" * 50)
    print("Customer:")
    print("  Email: aditi.customer@demo.in")
    print("  Password: demo12345")
    print("\nProvider:")
    print("  Email: ravi@rasoicentral.in")
    print("  Password: demo12345")
    print("=" * 50)


def main():
    """Main initialization workflow."""
    print("🚀 TFD Database Initialization")
    print("=" * 50)
    
    # Step 1: Check connection
    if not check_database_connection():
        print("\n❌ Cannot proceed: Database not accessible")
        return 1
    
    # Step 2: Create tables
    if create_all_tables() == 0:
        print("\n❌ Cannot proceed: Failed to create tables")
        return 1
    
    # Step 3: Populate data
    if not populate_demo_data():
        print("\n⚠️  Tables created but demo data population failed")
        # Still return 0 because tables exist
    
    # Step 4: Verify
    counts = verify_database()
    print_verification_report(counts)
    
    total_rows = sum(counts.values())
    if total_rows > 0:
        print("\n✅ Database initialization complete!")
        return 0
    else:
        print("\n⚠️  Database created but no data populated")
        return 1


if __name__ == "__main__":
    sys.exit(main())
