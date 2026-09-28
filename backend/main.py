import pandas as pd
import io
import random
from datetime import datetime, timedelta
from fastapi import FastAPI, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt

# Data Analyzer Helper Functions
from analyzer import clean_dataset_df, analyze_dataset_query

app = FastAPI(title="AnalytixAI API")

# CORS Configuration
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

# Temporary In-Memory Storage
users_db = {}
CURRENT_DATASET = {"df": None}

# Pydantic Schemas
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

# ----------------- AUTHENTICATION ROUTES -----------------

@app.get("/")
def home():
    return {"status": "online", "message": "AnalytixAI FastAPI Backend Running Successfully!"}

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

# ----------------- DATA ANALYZER ROUTES -----------------

# 4. FILE UPLOAD & SMART DATA CLEANER API (Dual route support)
@app.post("/api/data/upload")
@app.post("/api/data/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported.")
            
        summary, cleaned_df = clean_dataset_df(df)
        CURRENT_DATASET["df"] = cleaned_df
        
        return {
            "success": True,
            "filename": file.filename,
            "summary": summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

# 5. AI QUERY ASSISTANT API
@app.post("/api/data/query")
@app.post("/api/data/query/")
async def query_data(data: dict):
    if CURRENT_DATASET["df"] is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded yet.")
        
    user_query = data.get("query", "")
    result = analyze_dataset_query(CURRENT_DATASET["df"], user_query)
    return {"success": True, "result": result}
