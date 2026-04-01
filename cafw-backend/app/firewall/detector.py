import re
from typing import Optional

# --- Attack patterns ---

SQLI_PATTERNS = [
    r"(\%27)|(\')|(\-\-)|(\%23)|(#)",
    r"((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))",
    r"union.*select",
    r"select.*from",
    r"insert.*into",
    r"drop\s+table",
    r"or\s+1\s*=\s*1",
    r"or\s+\'1\'\s*=\s*\'1\'",
    r"exec(\s|\+)+(s|x)p\w+",
    r";\s*shutdown",
    r"1\s*=\s*1",
    r"1\s*=\s*0",
    r"benchmark\s*\(",
    r"sleep\s*\(",
    r"waitfor\s+delay",
]

XSS_PATTERNS = [
    r"<script.*?>",
    r"</script>",
    r"javascript\s*:",
    r"on\w+\s*=",
    r"<.*?on\w+.*?>",
    r"<img[^>]+src[^>]*>",
    r"alert\s*\(",
    r"document\.cookie",
    r"document\.write",
    r"eval\s*\(",
    r"expression\s*\(",
    r"<iframe.*?>",
    r"<object.*?>",
    r"<embed.*?>",
    r"vbscript\s*:",
]

CMDI_PATTERNS = [
    r";\s*(ls|dir|cat|pwd|whoami|id|uname)",
    r"\|\s*(ls|dir|cat|pwd|whoami|id|uname)",
    r"&&\s*(ls|dir|cat|pwd|whoami|id|uname)",
    r"`.*`",
    r"\$\(.*\)",
    r"rm\s+-rf",
    r"chmod\s+",
    r"wget\s+http",
    r"curl\s+http",
    r"/etc/passwd",
    r"/etc/shadow",
    r"nc\s+-",
    r"python\s+-c",
    r"bash\s+-c",
    r"cmd\.exe",
    r"powershell",
]

PATH_TRAVERSAL_PATTERNS = [
    r"\.\./",
    r"\.\.\\",
    r"%2e%2e%2f",
    r"%2e%2e/",
    r"\.\.%2f",
    r"%2e%2e%5c",
    r"/etc/passwd",
    r"/etc/shadow",
    r"c:\\windows",
    r"c:/windows",
    r"boot\.ini",
    r"win\.ini",
]

# --- Compile all patterns for speed ---

def _compile(patterns):
    return [re.compile(p, re.IGNORECASE) for p in patterns]

COMPILED = {
    "SQL Injection":   _compile(SQLI_PATTERNS),
    "XSS":            _compile(XSS_PATTERNS),
    "Command Injection": _compile(CMDI_PATTERNS),
    "Path Traversal": _compile(PATH_TRAVERSAL_PATTERNS),
}

# --- Main detection function ---

def detect_attack(value: str) -> Optional[dict]:
    """
    Scans a single string value against all attack patterns.
    Returns a dict with category and matched pattern, or None if clean.
    """
    if not value or not isinstance(value, str):
        return None

    for category, patterns in COMPILED.items():
        for pattern in patterns:
            if pattern.search(value):
                return {
                    "category": category,
                    "matched_pattern": pattern.pattern,
                    "payload": value[:500]
                }
    return None


def scan_request(data: dict) -> Optional[dict]:
    """
    Scans all values in a request data dict.
    Returns first attack found, or None if all clean.
    """
    for key, value in data.items():
        if isinstance(value, str):
            result = detect_attack(value)
            if result:
                return result
        elif isinstance(value, (list, dict)):
            result = detect_attack(str(value))
            if result:
                return result
    return None