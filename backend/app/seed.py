import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine, Base
from app import models

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Categories - expense
        expense_categories = [
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
        income_categories = [
            ("Salário", "income", "💵"),
            ("Renda Extra", "income", "💸"),
            ("Rendimentos", "income", "📈"),
        ]
        for name, ctype, icon in expense_categories + income_categories:
            if not db.query(models.Category).filter(models.Category.name == name).first():
                db.add(models.Category(name=name, type=ctype, icon=icon))

        # Banks
        for bank_name in ["Itaú", "XP"]:
            if not db.query(models.Bank).filter(models.Bank.name == bank_name).first():
                db.add(models.Bank(name=bank_name))

        # Payment methods
        for pm_name in ["Débito", "Crédito"]:
            if not db.query(models.PaymentMethod).filter(models.PaymentMethod.name == pm_name).first():
                db.add(models.PaymentMethod(name=pm_name))

        db.commit()
        print("Seed concluído com sucesso!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
