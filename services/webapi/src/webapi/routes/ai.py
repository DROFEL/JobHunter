from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])

CallType = Literal["job_summary", "resume_summary", "work_experience"]


class AIGenerateRequest(BaseModel):
    call_type: CallType
    prompt: str
    context: str = ""
    url: str = ""


class AIGenerateResponse(BaseModel):
    result: str


_STUBS: dict[CallType, str] = {
    "job_summary": "This role emphasizes building polished, high-conversion interfaces with strong attention to accessibility and measurable product outcomes. [stub — real fetch not yet implemented]",
    "resume_summary": "Experienced engineer with a track record of shipping clean, accessible interfaces and collaborating closely with product and design teams. [stub — real generation not yet implemented]",
    "work_experience": "Delivered impactful improvements to core user flows, reducing friction and improving key product metrics through close collaboration across engineering and design. [stub — real generation not yet implemented]",
}


@router.post("/generate", response_model=AIGenerateResponse)
def generate(body: AIGenerateRequest) -> AIGenerateResponse:
    return AIGenerateResponse(result=_STUBS[body.call_type])
