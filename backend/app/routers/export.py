import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

router = APIRouter(tags=["export"])

@router.get("/export/csv")
def export_csv(start_date: date = Query(...), end_date: date = Query(...), db: Session = Depends(get_db)):
    transactions = db.query(models.Transaction).filter(
        models.Transaction.date >= start_date,
        models.Transaction.date <= end_date,
    ).order_by(models.Transaction.date).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Data", "Tipo", "Descrição", "Categoria", "Banco", "Método de Pagamento", "Valor", "Parcela"])
    for t in transactions:
        installment = f"{t.installment_current}/{t.installment_total}" if t.installment_total else ""
        writer.writerow([
            t.id,
            t.date.strftime("%d/%m/%Y"),
            "Receita" if t.type == "income" else "Despesa",
            t.description,
            t.category.name,
            t.bank.name,
            t.payment_method.name,
            f"R$ {t.amount:,.2f}".replace(",", "X").replace(".", ",").replace("X", "."),
            installment,
        ])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=minhagrana_{start_date}_{end_date}.csv"},
    )

@router.get("/export/excel")
def export_excel(start_date: date = Query(...), end_date: date = Query(...), db: Session = Depends(get_db)):
    from openpyxl import Workbook
    transactions = db.query(models.Transaction).filter(
        models.Transaction.date >= start_date,
        models.Transaction.date <= end_date,
    ).order_by(models.Transaction.date).all()

    wb = Workbook()
    ws = wb.active
    ws.title = "Transações"
    ws.append(["ID", "Data", "Tipo", "Descrição", "Categoria", "Banco", "Método de Pagamento", "Valor", "Parcela"])
    for t in transactions:
        installment = f"{t.installment_current}/{t.installment_total}" if t.installment_total else ""
        ws.append([
            t.id,
            t.date.strftime("%d/%m/%Y"),
            "Receita" if t.type == "income" else "Despesa",
            t.description,
            t.category.name,
            t.bank.name,
            t.payment_method.name,
            float(t.amount),
            installment,
        ])
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=minhagrana_{start_date}_{end_date}.xlsx"},
    )
