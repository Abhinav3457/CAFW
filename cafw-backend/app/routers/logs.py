from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import AttackLog
from app.schemas import AttackLogOut

router = APIRouter(prefix="/logs", tags=["Attack Logs"])

@router.get("/", response_model=List[AttackLogOut])
def get_logs(
        skip: int = Query(0, ge=0),
        limit: int = Query(50, ge=1, le=500),
        category: Optional[str] = Query(None),
        ip_address: Optional[str] = Query(None),
        db: Session = Depends(get_db)
):
    query = db.query(AttackLog).order_by(AttackLog.timestamp.desc())
    if category:
        query = query.filter(AttackLog.category == category)
    if ip_address:
        query = query.filter(AttackLog.ip_address == ip_address)
    return query.offset(skip).limit(limit).all()

@router.get("/count")
def get_log_count(db: Session = Depends(get_db)):
    total = db.query(AttackLog).count()
    return {"total": total}

@router.get("/{log_id}", response_model=AttackLogOut)
def get_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(AttackLog).filter(AttackLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log
