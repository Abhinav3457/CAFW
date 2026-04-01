from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Rule
from app.schemas import RuleOut, RuleUpdate

router = APIRouter(prefix="/rules", tags=["Rules"])

@router.get("/", response_model=List[RuleOut])
def get_rules(db: Session = Depends(get_db)):
    return db.query(Rule).all()

@router.patch("/{rule_id}", response_model=RuleOut)
def toggle_rule(rule_id: int, update: RuleUpdate, db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    rule.is_active = update.is_active
    db.commit()
    db.refresh(rule)
    return rule