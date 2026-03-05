"""
Seed script – idempotent (safe to run multiple times).
Usage: python -m app.seed
"""
from .database import SessionLocal
from .models import Category, Bank, PaymentMethod


def seed():
    db = SessionLocal()
    try:
        categories_expense = [
            ("Alimentação", "expense", "🍔"),
            ("Gasolina", "expense", "⛽"),
            ("Carro", "expense", "🚗"),
            ("Saúde", "expense", "💊"),
            ("Educação", "expense", "📚"),
            ("Lazer", "expense", "🎮"),
            ("Vestuário", "expense", "👕"),
            ("Assinaturas", "expense", "📱"),
            ("Investimentos", "expense", "💰"),
        ]
        categories_income = [
            ("Salário", "income", "💵"),
            ("Renda Extra", "income", "💸"),
            ("Rendimentos", "income", "📈"),
        ]

        for name, cat_type, icon in categories_expense + categories_income:
            if not db.query(Category).filter(Category.name == name).first():
                db.add(Category(name=name, type=cat_type, icon=icon))

        for bank_name in ["Itaú", "XP"]:
            if not db.query(Bank).filter(Bank.name == bank_name).first():
                db.add(Bank(name=bank_name))

        for pm_name in ["Débito", "Crédito"]:
            if not db.query(PaymentMethod).filter(PaymentMethod.name == pm_name).first():
                db.add(PaymentMethod(name=pm_name))

        db.commit()
        print("✅ Seed concluído com sucesso!")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
