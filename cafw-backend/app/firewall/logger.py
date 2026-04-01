from sqlalchemy.orm import Session
from app.models import AttackLog, BlockedIP

def log_attack(
        db: Session,
        ip_address: str,
        method: str,
        endpoint: str,
        category: str,
        payload: str,
        rule_matched: str,
        action: str = "blocked"
):
    """Saves a blocked attack event to the database."""
    log = AttackLog(
        ip_address=ip_address,
        method=method,
        endpoint=endpoint,
        category=category,
        payload=payload,
        rule_matched=rule_matched,
        action=action
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def is_ip_blocked(db: Session, ip_address: str) -> bool:
    """Checks if an IP is in the permanent block list."""
    blocked = db.query(BlockedIP).filter(
        BlockedIP.ip_address == ip_address,
        BlockedIP.is_active == True
    ).first()
    return blocked is not None


def block_ip(db: Session, ip_address: str, reason: str):
    """Permanently blocks an IP address."""
    existing = db.query(BlockedIP).filter(
        BlockedIP.ip_address == ip_address
    ).first()
    if existing:
        existing.is_active = True
        existing.reason = reason
    else:
        blocked = BlockedIP(
            ip_address=ip_address,
            reason=reason
        )
        db.add(blocked)
    db.commit()