import csv
import io
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from openpyxl import Workbook
from ..database import get_db
from ..models import Transaction

router = APIRouter(tags=["export"])

HEADERS = ["ID", "Data", "Tipo", "Descrição", "Valor", "Categoria", "Banco", "Forma de Pagamento", "Parcela"]


def _get_transactions(db: Session, start_date: Optional[date], end_date: Optional[date]):
    q = db.query(Transaction)
    if start_date:
        q = q.filter(Transaction.date >= start_date)
    if end_date:
        q = q.filter(Transaction.date <= end_date)
    return q.order_by(Transaction.date).all()


def _row(t: Transaction):
    installment = ""
    if t.installment_total:
        installment = f"{t.installment_current}/{t.installment_total}"
    return [
        t.id,
        t.date.strftime("%d/%m/%Y"),
        "Receita" if t.type == "income" else "Despesa",
        t.description or "",
        float(t.amount),
        t.category.name if t.category else "",
        t.bank.name if t.bank else "",
        t.payment_method.name if t.payment_method else "",
        installment,
    ]


@router.get("/export/csv")
def export_csv(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    transactions = _get_transactions(db, start_date, end_date)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(HEADERS)
    for t in transactions:
        writer.writerow(_row(t))
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=transacoes.csv"},
    )


@router.get("/export/excel")
def export_excel(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    transactions = _get_transactions(db, start_date, end_date)
    wb = Workbook()
    ws = wb.active
    ws.title = "Transações"
    ws.append(HEADERS)
    for t in transactions:
        ws.append(_row(t))

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=transacoes.xlsx"},
    )
