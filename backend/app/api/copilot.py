# backend/app/api/copilot.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.copilot import handle_copilot_chat

router = APIRouter()

class CopilotQuery(BaseModel):
    question: str

@router.post("/copilot")
def query_copilot(query: CopilotQuery):
    if not query.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
        
    result = handle_copilot_chat(query.question)
    return result
