from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.database import engine, Base
from app.firewall.middleware import FirewallMiddleware
from app.routers import logs, rules, dashboard, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CAFW - Context Aware Firewall",
    version="1.0.0"
)

app.add_middleware(FirewallMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    return {"status": "CAFW is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok", "database": "connected"}

@app.get("/test/safe")
def test_safe():
    return {"message": "This is a safe endpoint — passed through firewall"}

@app.post("/test/login")
def test_login(data: LoginRequest):
    return {"message": "Login successful", "user": data.username}

@app.get("/test/search")
def test_search(q: str = ""):
    return {"message": "Search results", "query": q}