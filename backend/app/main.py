import logging

from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.routers import transactions, categories, banks, payment_methods, dashboard, export, annual_vision, auth, credit_cards, investments
from app.security import require_auth

logger = logging.getLogger("minhagrana")

app = FastAPI(title="Minha Grana API")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Erro não tratado em %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Erro interno do servidor"})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

protected = [Depends(require_auth)]

app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api", dependencies=protected)
app.include_router(categories.router, prefix="/api", dependencies=protected)
app.include_router(banks.router, prefix="/api", dependencies=protected)
app.include_router(payment_methods.router, prefix="/api", dependencies=protected)
app.include_router(dashboard.router, prefix="/api", dependencies=protected)
app.include_router(export.router, prefix="/api", dependencies=protected)
app.include_router(annual_vision.router, prefix="/api", dependencies=protected)
app.include_router(credit_cards.router, prefix="/api", dependencies=protected)
app.include_router(investments.router, prefix="/api", dependencies=protected)

@app.get("/")
def root():
    return {"message": "Minha Grana API"}
