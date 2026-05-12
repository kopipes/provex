"""
Database initialization script for ReimburseEasy
Creates initial admin user and seed data
"""
import os
import sys

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base, SessionLocal
from app.models import User, Project, ProjectMember, AIConfig, Claim
from app.auth import get_password_hash
from datetime import date, datetime, timedelta

def init_db():
    """Initialize database with tables and seed data"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created.")
    
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == "admin@reimburseeasy.com").first()
        if existing_admin:
            print("Admin user already exists.")
        else:
            # Create admin user
            admin = User(
                name="Admin User",
                email="admin@reimburseeasy.com",
                password_hash=get_password_hash("admin123"),
                role="admin",
                status="active",
                department="IT"
            )
            db.add(admin)
            db.flush()
            print(f"Created admin user: admin@reimburseeasy.com / admin123")
            
            # Create manager user
            manager = User(
                name="Manager User",
                email="manager@reimburseeasy.com",
                password_hash=get_password_hash("manager123"),
                role="manager",
                status="active",
                department="Finance"
            )
            db.add(manager)
            db.flush()
            print(f"Created manager user: manager@reimburseeasy.com / manager123")
            
            # Create regular user
            user = User(
                name="Regular User",
                email="user@reimburseeasy.com",
                password_hash=get_password_hash("user123"),
                role="user",
                status="active",
                department="Engineering"
            )
            db.add(user)
            db.flush()
            print(f"Created regular user: user@reimburseeasy.com / user123")
            
            # Create sample project
            project = Project(
                name="Proyek Gedung A",
                description="Pengembangan Gedung A kantor pusat",
                start_date=date(2025, 1, 1),
                end_date=date(2025, 12, 31),
                budget_limit=500000000,
                status="active",
                created_by=admin.id
            )
            db.add(project)
            db.flush()
            
            # Assign users to project
            pm1 = ProjectMember(project_id=project.id, user_id=admin.id, assigned_by=admin.id)
            pm2 = ProjectMember(project_id=project.id, user_id=manager.id, assigned_by=admin.id)
            pm3 = ProjectMember(project_id=project.id, user_id=user.id, assigned_by=admin.id)
            db.add_all([pm1, pm2, pm3])
            
            # Create second project
            project2 = Project(
                name="Business Trip Singapore",
                description="Perjalanan bisnis ke Singapore Q2 2025",
                start_date=date(2025, 4, 1),
                end_date=date(2025, 6, 30),
                budget_limit=100000000,
                status="active",
                created_by=admin.id
            )
            db.add(project2)
            db.flush()
            
            pm4 = ProjectMember(project_id=project2.id, user_id=admin.id, assigned_by=admin.id)
            pm5 = ProjectMember(project_id=project2.id, user_id=manager.id, assigned_by=admin.id)
            db.add_all([pm4, pm5])
            
            print(f"Created sample projects and assigned members.")
            
            # Initialize AI config (empty with OCR enabled by default)
            ai_config = AIConfig(id=1, ocr_enabled=True)
            db.add(ai_config)
            
            # Create sample claims for testing
            sample_claims = [
                # Claims for user (submitted)
                Claim(
                    user_id=user.id,
                    project_id=project.id,
                    merchant_name="Warung Mang Sule",
                    transaction_date=date(2025, 5, 1),
                    amount=75000,
                    category="Makanan",
                    description="Makan siang tim",
                    receipt_number="STR-001",
                    status="submitted",
                    ai_extracted=False,
                    created_at=datetime.utcnow() - timedelta(days=2),
                    updated_at=datetime.utcnow() - timedelta(days=2)
                ),
                Claim(
                    user_id=user.id,
                    project_id=project.id,
                    merchant_name="Gojek",
                    transaction_date=date(2025, 5, 2),
                    amount=25000,
                    category="Transport",
                    description="Ojol ke kantor client",
                    receipt_number="STR-002",
                    status="approved",
                    ai_extracted=False,
                    reviewed_by=manager.id,
                    reviewed_at=datetime.utcnow() - timedelta(days=1),
                    created_at=datetime.utcnow() - timedelta(days=3),
                    updated_at=datetime.utcnow() - timedelta(days=1)
                ),
                Claim(
                    user_id=user.id,
                    project_id=project.id,
                    merchant_name="Hotel Bintang",
                    transaction_date=date(2025, 5, 3),
                    amount=500000,
                    category="Akomodasi",
                    description="Menginap untuk meeting client",
                    receipt_number="STR-003",
                    status="revision",
                    notes="Silakan upload struk yang lebih jelas",
                    ai_extracted=False,
                    reviewed_by=manager.id,
                    reviewed_at=datetime.utcnow() - timedelta(hours=5),
                    created_at=datetime.utcnow() - timedelta(days=1),
                    updated_at=datetime.utcnow() - timedelta(hours=5)
                ),
                # Claims for manager (approved)
                Claim(
                    user_id=manager.id,
                    project_id=project.id,
                    merchant_name="Tiket Pesawat",
                    transaction_date=date(2025, 4, 15),
                    amount=2500000,
                    category="Transport",
                    description="Tiket meeting di Jakarta",
                    receipt_number="STR-004",
                    status="approved",
                    ai_extracted=False,
                    reviewed_by=admin.id,
                    reviewed_at=datetime.utcnow() - timedelta(days=5),
                    created_at=datetime.utcnow() - timedelta(days=7),
                    updated_at=datetime.utcnow() - timedelta(days=5)
                ),
                Claim(
                    user_id=manager.id,
                    project_id=project2.id,
                    merchant_name="Taxi Singapore",
                    transaction_date=date(2025, 4, 20),
                    amount=150000,
                    category="Transport",
                    description="Taxi dari airport ke hotel",
                    receipt_number="STR-005",
                    status="submitted",
                    ai_extracted=False,
                    created_at=datetime.utcnow() - timedelta(days=1),
                    updated_at=datetime.utcnow() - timedelta(days=1)
                ),
                # Draft claim
                Claim(
                    user_id=user.id,
                    project_id=project.id,
                    merchant_name="Kopi Kenangan",
                    transaction_date=date(2025, 5, 5),
                    amount=35000,
                    category="Makanan",
                    description="Kopi meeting pagi",
                    status="draft",
                    ai_extracted=False,
                    created_at=datetime.utcnow() - timedelta(hours=2),
                    updated_at=datetime.utcnow() - timedelta(hours=2)
                ),
            ]
            db.add_all(sample_claims)
            
            db.commit()
            print("Created sample claims for testing.")
            print("Database initialization complete!")
            
    except Exception as e:
        db.rollback()
        print(f"Error during initialization: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
