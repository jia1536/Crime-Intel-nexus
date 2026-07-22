"""SentinelGrid auth — JWT + bcrypt (officer/admin accounts)."""
import os, uuid, bcrypt, jwt
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, EmailStr

JWT_ALG = "HS256"
ACCESS_TTL_MIN = 60 * 12  # 12 hours for demo convenience


def _secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str, name: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role, "name": name,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
        "type": "access",
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALG)


def decode_token(token: str) -> dict:
    return jwt.decode(token, _secret(), algorithms=[JWT_ALG])


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "officer"
    unit: Optional[str] = None


DEFAULT_OFFICERS = [
    {"email": "admin@sentinelgrid.gov.in", "password": "admin@123", "name": "Cmdr. A. Iyer", "role": "admin", "unit": "Command Centre"},
    {"email": "sharma@delhi.police.in", "password": "officer@123", "name": "Insp. R. Sharma", "role": "officer", "unit": "Delhi Cyber Cell"},
    {"email": "patel@mumbai.police.in", "password": "officer@123", "name": "SI A. Patel", "role": "officer", "unit": "Mumbai EOW"},
    {"email": "nair@bengaluru.police.in", "password": "officer@123", "name": "Insp. K. Nair", "role": "officer", "unit": "Bengaluru Cyber"},
    {"email": "kaur@pune.police.in", "password": "officer@123", "name": "SI P. Kaur", "role": "officer", "unit": "Pune Crime Branch"},
]


async def ensure_users(db):
    for u in DEFAULT_OFFICERS:
        existing = await db.users.find_one({"email": u["email"]})
        if not existing:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": u["email"],
                "password_hash": hash_password(u["password"]),
                "name": u["name"],
                "role": u["role"],
                "unit": u["unit"],
                "created_at": datetime.now(timezone.utc).isoformat(),
            })


def build_auth_router(db):
    r = APIRouter(prefix="/api/auth", tags=["auth"])

    async def _get_current(request: Request) -> dict:
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            raise HTTPException(401, "Missing bearer token")
        token = auth[7:]
        try:
            payload = decode_token(token)
        except jwt.ExpiredSignatureError:
            raise HTTPException(401, "Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(401, "Invalid token")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(401, "User not found")
        return user

    @r.post("/login")
    async def login(inp: LoginIn):
        u = await db.users.find_one({"email": inp.email.lower()})
        if not u or not verify_password(inp.password, u["password_hash"]):
            raise HTTPException(401, "Invalid email or password")
        token = create_access_token(u["id"], u["email"], u["role"], u["name"])
        return {
            "token": token,
            "user": {"id": u["id"], "email": u["email"], "name": u["name"], "role": u["role"], "unit": u.get("unit")},
        }

    @r.post("/register")
    async def register(inp: RegisterIn):
        if await db.users.find_one({"email": inp.email.lower()}):
            raise HTTPException(400, "Email already registered")
        uid = str(uuid.uuid4())
        doc = {
            "id": uid, "email": inp.email.lower(),
            "password_hash": hash_password(inp.password),
            "name": inp.name, "role": inp.role if inp.role in ("officer", "admin") else "officer",
            "unit": inp.unit or "Field", "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(doc)
        token = create_access_token(uid, doc["email"], doc["role"], doc["name"])
        return {"token": token, "user": {k: doc[k] for k in ["id", "email", "name", "role", "unit"]}}

    @r.get("/me")
    async def me(user=Depends(_get_current)):
        return user

    return r, _get_current
