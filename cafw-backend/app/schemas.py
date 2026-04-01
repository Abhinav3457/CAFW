from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class AttackLogOut(BaseModel):
    id:           int
    ip_address:   str
    method:       str
    endpoint:     str
    category:     str
    payload:      str
    rule_matched: str
    action:       str
    timestamp:    datetime

    class Config:
        from_attributes = True

class RuleOut(BaseModel):
    id:          int
    name:        str
    description: str
    pattern:     str
    category:    str
    is_active:   bool
    created_at:  datetime

    class Config:
        from_attributes = True

class RuleUpdate(BaseModel):
    is_active: bool

class BlockedIPOut(BaseModel):
    id:         int
    ip_address: str
    reason:     str
    blocked_at: datetime
    is_active:  bool

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_requests_today: int
    attacks_blocked_today: int
    unique_attacker_ips:  int
    top_attack_category:  str