from fastapi import FastAPI, HTTPException, Status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt
import random

app = FastAPI(title="AnalytixAI API")

# CORS Configuration (Frontend access ke liye)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password Hashing & JWT Secret
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "analytix_ai_secret_key_2026"
ALGORITHM = "HS256"

# Temporary In-Memory Database (Demo Purpose)
users_db = {}

# Schemas
class UserSignup(BaseModel):
    fullName: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyEmail(BaseModel):
    email: EmailStr
    otp: str

# Helper Functions
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=7)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ----------------- ROUTES -----------------

@app.get("/")
def home():
    return {"message": "AnalytixAI FastAPI Backend Running Successfully!"}

# 1. SIGNUP API
@app.post("/api/auth/signup")
def signup(user: UserSignup):
    if user.email in users_db:
        raise HTTPException(status_code=400, detail="Email is already registered.")
    
    otp = str(random.randint(100000, 999999))
    
    users_db[user.email] = {
        "fullName": user.fullName,
        "email": user.email,
        "password": hash_password(user.password),
        "isVerified": False,
        "otp": otp,
        "plan": "Free"
    }
    
    return {
        "success": True,
        "message": "User registered successfully.",
        "otpDemo": otp
    }

# 2. VERIFY EMAIL API
@app.post("/api/auth/verify-email")
def verify_email(data: VerifyEmail):
    user = users_db.get(data.email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if user["otp"] != data.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
    
    user["isVerified"] = True
    user["otp"] = None
    return {"success": True, "message": "Email verified successfully!"}

# 3. LOGIN API
@app.post("/api/auth/login")
def login(user: UserLogin):
    db_user = users_db.get(user.email)
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password.")
    
    token = create_access_token({"sub": user.email})
    
    return {
        "success": True,
        "token": token,
        "user": {
            "fullName": db_user["fullName"],
            "email": db_user["email"],
            "plan": db_user["plan"]
        }
    }
