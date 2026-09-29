from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
from backend.analyzer import clean_dataset_df, analyze_dataset_query

app = FastAPI(title="AI Data Analyzer")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

df_store = None

@app.get("/")
def home():
    return {"message": "AI Data Analyzer API Running"}

@app.post("/upload")
async def upload(file: UploadFile = File(...)):
    global df_store

    if file.filename.endswith(".csv"):
        df = pd.read_csv(file.file)
    else:
        df = pd.read_excel(file.file)

    summary, df = clean_dataset_df(df)
    df_store = df

    return {
        "filename": file.filename,
        "summary": summary
    }

@app.get("/analyze")
def analyze(q: str):
    if df_store is None:
        return {"error": "Upload a dataset first"}

    return analyze_dataset_query(df_store, q)
