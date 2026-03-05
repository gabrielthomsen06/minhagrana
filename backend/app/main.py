from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routers import transactions, categories, banks, payment_methods, dashboard, export

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Minha Grana API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transactions.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(banks.router, prefix="/api")
app.include_router(payment_methods.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(export.router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Minha Grana API"}
