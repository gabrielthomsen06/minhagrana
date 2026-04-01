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

        # Banks (com dados de cartão de crédito)
        bank_data = [
            {"name": "Itaú", "closing_day": 25, "credit_limit": 2600.00},
            {"name": "XP", "closing_day": 27, "credit_limit": 2000.00},
        ]
        for bd in bank_data:
            existing = db.query(models.Bank).filter(models.Bank.name == bd["name"]).first()
            if existing:
                existing.closing_day = bd["closing_day"]
                existing.credit_limit = bd["credit_limit"]
            else:
                db.add(models.Bank(**bd))

        # Payment methods
        for pm_name in ["Débito", "Crédito"]:
            if not db.query(models.PaymentMethod).filter(models.PaymentMethod.name == pm_name).first():
                db.add(models.PaymentMethod(name=pm_name))

        # Investment accounts
        inv_data = [
            {"bank_name": "XP", "balance": 9900.00},
            {"bank_name": "Itaú", "balance": 2400.00},
        ]
        for inv in inv_data:
            bank = db.query(models.Bank).filter(models.Bank.name == inv["bank_name"]).first()
            if bank:
                existing = db.query(models.InvestmentAccount).filter(
                    models.InvestmentAccount.bank_id == bank.id
                ).first()
                if not existing:
                    db.add(models.InvestmentAccount(bank_id=bank.id, balance=inv["balance"]))

        db.commit()
        print("Seed concluído com sucesso!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
