import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.database import Base, engine
from app.firewall.middleware import FirewallMiddleware
from app.routers import auth, dashboard, logs, rules

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

VERSION = "1.0.0"


def _get_allowed_origins() -> list[str]:
    configured = os.getenv("FRONTEND_ORIGINS", "").strip()
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CAFW - Context Aware Firewall",
    version=VERSION,
)

app.add_middleware(FirewallMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(logs.router)
app.include_router(rules.router)
app.include_router(dashboard.router)

class LoginRequest(BaseModel):
    username: str
    password: str

@app.get("/")
def root():
    return {"status": "CAFW is running", "version": VERSION}

@app.get("/health")
def health():
    return {"status": "ok", "database": "connected"}

@app.get("/test/safe")
def test_safe():
    return {"message": "This is a safe endpoint - passed through firewall"}

@app.post("/test/login")
def test_login(data: LoginRequest):
    return {"message": "Login successful", "user": data.username}

@app.get("/test/search")
def test_search(q: str = ""):
    return {"message": "Search results", "query": q}

