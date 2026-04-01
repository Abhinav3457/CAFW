import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from app.database import SessionLocal
from app.firewall.detector import detect_attack, scan_request
from app.firewall.logger import log_attack, is_ip_blocked

WHITELIST_PATHS = [
    "/",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/auth/register",
    "/auth/verify-register",
    "/auth/login",
    "/auth/verify-login",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/check-otp-store",
    "/dashboard/stats",
    "/dashboard/category-breakdown",
    "/dashboard/recent-attacks",
    "/dashboard/top-attackers",
    "/logs/",
    "/logs/count",
    "/rules/",
]

class FirewallMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        path = request.url.path

        # Skip whitelisted paths
        if (path in WHITELIST_PATHS
                or path.startswith("/auth/")
                or path.startswith("/docs")
                or path.startswith("/redoc")
                or path.startswith("/openapi")):
            return await call_next(request)

        db = SessionLocal()
        try:
            ip     = request.client.host if request.client else "unknown"
            method = request.method

            # Check 1 — blocked IP
            if is_ip_blocked(db, ip):
                return JSONResponse(
                    status_code=403,
                    content={
                        "error":  "Access denied",
                        "reason": "Your IP has been permanently blocked",
                        "ip":     ip
                    }
                )

            # Check 2 — query params
            query_data = dict(request.query_params)
            attack = scan_request(query_data)
            if attack:
                log_attack(
                    db=db, ip_address=ip, method=method,
                    endpoint=path, category=attack["category"],
                    payload=attack["payload"],
                    rule_matched=attack["matched_pattern"]
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error":    "Request blocked",
                        "reason":   attack["category"] + " attack detected",
                        "category": attack["category"]
                    }
                )

            # Check 3 — request body
            if method in ["POST", "PUT", "PATCH"]:
                try:
                    body_bytes = await request.body()
                    if body_bytes:
                        body = json.loads(body_bytes.decode("utf-8"))
                        if isinstance(body, dict):
                            attack = scan_request(body)
                        else:
                            attack = detect_attack(str(body))
                        if attack:
                            log_attack(
                                db=db, ip_address=ip, method=method,
                                endpoint=path, category=attack["category"],
                                payload=attack["payload"],
                                rule_matched=attack["matched_pattern"]
                            )
                            return JSONResponse(
                                status_code=403,
                                content={
                                    "error":    "Request blocked",
                                    "reason":   attack["category"] + " attack detected",
                                    "category": attack["category"]
                                }
                            )
                except Exception:
                    pass

            # Check 4 — URL path itself
            path_attack = detect_attack(path)
            if path_attack:
                log_attack(
                    db=db, ip_address=ip, method=method,
                    endpoint=path, category=path_attack["category"],
                    payload=path_attack["payload"],
                    rule_matched=path_attack["matched_pattern"]
                )
                return JSONResponse(
                    status_code=403,
                    content={
                        "error":    "Request blocked",
                        "reason":   path_attack["category"] + " attack detected",
                        "category": path_attack["category"]
                    }
                )

            return await call_next(request)

        finally:
            db.close()