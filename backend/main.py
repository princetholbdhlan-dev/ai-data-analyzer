from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
from analyzer import analyze_dataset, answer_dataset_question

app = FastAPI(title="AnalytixAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatQueryRequest(BaseModel):
    question: str
    stats: Dict[str, Any]
    insights: List[str]

@app.get("/")
def read_root():
    return {"status": "online", "message": "AnalytixAI Backend Engine is running!"}

@app.post("/analyze")
async def analyze_file(file: UploadFile = File(...)):
    if not (file.filename.endswith('.csv') or file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported.")
    
    try:
        contents = await file.read()
        result = analyze_dataset(contents, file.filename)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_data(payload: ChatQueryRequest):
    try:
        answer = answer_dataset_question(payload.question, payload.stats, payload.insights)
        return {"success": True, "answer": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
