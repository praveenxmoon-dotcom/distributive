"""DisruptionIQ Decision Intelligence Engine — FastAPI application.

Run locally:
  cd backend
  pip install -e .
  uvicorn main:app --reload --port 8000

API docs available at http://localhost:8000/docs
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .app.api import router
from .app.config import get_settings

settings = get_settings()

app = FastAPI(
    title="DisruptionIQ Decision Intelligence Engine",
    description=(
        "Analyzes supply-chain disruptions, calculates explainable risk scores, "
        "and recommends feasible recovery plans for human manager review. "
        "All data is synthetic. No real operations are performed."
    ),
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/", tags=["Health"])
def root():
    return {
        "service": "DisruptionIQ Decision Intelligence Engine",
        "version": "0.1.0",
        "status": "running",
        "llm_provider": settings.llm_provider,
        "synthetic": True,
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
