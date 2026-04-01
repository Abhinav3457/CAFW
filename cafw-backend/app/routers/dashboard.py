from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from datetime import datetime, date
from app.database import get_db
from app.models import AttackLog, BlockedIP

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    today = date.today()

    total_today = db.query(AttackLog).filter(
        func.date(AttackLog.timestamp) == today
    ).count()

    blocked_today = db.query(AttackLog).filter(
        func.date(AttackLog.timestamp) == today,
        AttackLog.action == "blocked"
    ).count()

    unique_ips = db.query(AttackLog.ip_address).distinct().count()

    top_category = db.query(
        AttackLog.category,
        func.count(AttackLog.category).label("count")
    ).group_by(AttackLog.category).order_by(func.count(AttackLog.category).desc()).first()

    return {
        "total_attacks_today": total_today,
        "attacks_blocked_today": blocked_today,
        "unique_attacker_ips": unique_ips,
        "top_attack_category": top_category[0] if top_category else "None"
    }

@router.get("/category-breakdown")
def get_category_breakdown(db: Session = Depends(get_db)):
    results = db.query(
        AttackLog.category,
        func.count(AttackLog.category).label("count")
    ).group_by(AttackLog.category).all()
    return [{"category": r[0], "count": r[1]} for r in results]

@router.get("/recent-attacks")
def get_recent_attacks(db: Session = Depends(get_db)):
    logs = db.query(AttackLog).order_by(
        AttackLog.timestamp.desc()
    ).limit(10).all()
    return [
        {
            "id": l.id,
            "ip_address": l.ip_address,
            "method": l.method,
            "endpoint": l.endpoint,
            "category": l.category,
            "timestamp": l.timestamp
        } for l in logs
    ]

@router.get("/top-attackers")
def get_top_attackers(db: Session = Depends(get_db)):
    results = db.query(
        AttackLog.ip_address,
        func.count(AttackLog.ip_address).label("count")
    ).group_by(AttackLog.ip_address).order_by(
        func.count(AttackLog.ip_address).desc()
    ).limit(10).all()
    return [{"ip_address": r[0], "attack_count": r[1]} for r in results]