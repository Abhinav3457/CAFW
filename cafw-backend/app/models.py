from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class AttackLog(Base):
    __tablename__ = "attack_logs"

    id          = Column(Integer, primary_key=True, index=True)
    ip_address  = Column(String, index=True)
    method      = Column(String)
    endpoint    = Column(String)
    category    = Column(String)
    payload     = Column(Text)
    rule_matched= Column(String)
    action      = Column(String, default="blocked")
    timestamp   = Column(DateTime(timezone=True), server_default=func.now())

class Rule(Base):
    __tablename__ = "rules"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, unique=True)
    description = Column(String)
    pattern     = Column(String)
    category    = Column(String)
    is_active   = Column(Boolean, default=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class BlockedIP(Base):
    __tablename__ = "blocked_ips"

    id          = Column(Integer, primary_key=True, index=True)
    ip_address  = Column(String, unique=True, index=True)
    reason      = Column(String)
    blocked_at  = Column(DateTime(timezone=True), server_default=func.now())
    is_active   = Column(Boolean, default=True)
class AdminUser(Base):
    __tablename__ = "admin_users"

    id              = Column(Integer, primary_key=True, index=True)
    full_name       = Column(String)
    email           = Column(String, unique=True, index=True)
    password_hash   = Column(String)
    failed_attempts = Column(Integer, default=0)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
class SystemConfig(Base):
    __tablename__ = "system_config"

    id    = Column(Integer, primary_key=True)
    key   = Column(String, unique=True, index=True)
    value = Column(String)