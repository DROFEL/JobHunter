from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from webapi.services.LLMService import (
    generate_project_description,
    generate_resume_summary,
    generate_skills_suggestion,
    generate_work_experience_bullets,
)

router = APIRouter(prefix="/builder", tags=["builder"])

GenerateCallType = Literal["resume_summary", "work_experience", "project_description", "skills_suggestion"]


class BuilderGenerateRequest(BaseModel):
    call_type: GenerateCallType
    prompt: str
    context: str = ""
    items: list[str] = []


class BuilderGenerateResponse(BaseModel):
    result: str


@router.post("/generate", response_model=BuilderGenerateResponse)
def generate(body: BuilderGenerateRequest) -> BuilderGenerateResponse:
    try:
        if body.call_type == "resume_summary":
            result = generate_resume_summary(body.prompt, body.context)

        elif body.call_type == "work_experience":
            # prompt encodes "company|duration|target_role" (pipe-delimited)
            # context holds existing bullets (newline-separated)
            # items holds job context lines
            parts = body.prompt.split("|", 2)
            company = parts[0] if len(parts) > 0 else ""
            duration = parts[1] if len(parts) > 1 else ""
            target_role = parts[2] if len(parts) > 2 else ""
            existing = [b.strip() for b in body.context.split("\n") if b.strip()] if body.context else []
            job_context = "\n".join(body.items) if body.items else ""
            result = generate_work_experience_bullets(company, duration, target_role, job_context, existing)

        elif body.call_type == "project_description":
            result = generate_project_description(body.prompt, body.context)

        elif body.call_type == "skills_suggestion":
            result = generate_skills_suggestion(body.prompt, body.items)

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported call_type: {body.call_type}")

        return BuilderGenerateResponse(result=result)

    except HTTPException:
        raise
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception:
        raise HTTPException(status_code=500, detail="AI generation failed. Please try again.")
