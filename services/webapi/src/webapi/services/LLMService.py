import json
import threading
import time

from langchain_openrouter import ChatOpenRouter
from openrouter.errors.toomanyrequestsresponse_error import TooManyRequestsResponseError
from openrouter.errors.responsevalidationerror import ResponseValidationError
from pydantic import BaseModel
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from common.config import get_settings


class _RateLimiter:
    def __init__(self, calls_per_second: float) -> None:
        self._lock = threading.Lock()
        self._interval = 1.0 / calls_per_second
        self._last_call = 0.0

    def acquire(self) -> None:
        with self._lock:
            now = time.monotonic()
            wait = self._interval - (now - self._last_call)
            if wait > 0:
                time.sleep(wait)
            self._last_call = time.monotonic()


_limiter = _RateLimiter(calls_per_second=get_settings().openrouter_rps)


def _get_llm() -> ChatOpenRouter:
    api_key = get_settings().open_router_sk
    if not api_key:
        raise ValueError("OPEN_ROUTER_SK is not set")
    return ChatOpenRouter(
        model="google/gemini-3.1-flash-lite-preview",
        api_key=api_key,
        temperature=0.7,
    )


def _invoke(llm, prompt: str):
    _limiter.acquire()
    return llm.invoke(prompt)


_rate_limit_retry = retry(
    retry=retry_if_exception_type((TooManyRequestsResponseError, ResponseValidationError)),
    wait=wait_exponential(multiplier=2, min=10, max=60),
    stop=stop_after_attempt(3),
    reraise=True,
)


# --- Structured output models ---

class ResumeSummaryOutput(BaseModel):
    summary: str


class WorkExperienceOutput(BaseModel):
    bullets: list[str]


class ProjectDescriptionOutput(BaseModel):
    description: str


class SkillCategory(BaseModel):
    name: str
    skills: list[str]


class SkillsOutput(BaseModel):
    categories: list[SkillCategory]


# --- Generation functions ---

@_rate_limit_retry
def generate_resume_summary(target_position: str, context: str) -> str:
    prompt = f"""Write a professional summary (max 260 characters) for a resume.

Target position: {target_position}

{context}

Rules:
- Write implicitly in first person (no "I")
- Specific and technical — no generic phrases like "passionate" or "team player"
- Max 260 characters total
- Return ONLY the summary in the `summary` field"""

    llm = _get_llm().with_structured_output(ResumeSummaryOutput)
    result: ResumeSummaryOutput = _invoke(llm, prompt)
    return result.summary


@_rate_limit_retry
def generate_work_experience_bullets(
    company: str,
    duration: str,
    target_role: str,
    job_context: str,
    existing_bullets: list[str],
) -> str:
    existing_text = (
        "\n".join(f"{i + 1}. {b}" for i, b in enumerate(existing_bullets))
        if existing_bullets
        else "(none yet)"
    )

    prompt = f"""Improve or write achievement bullet points for a computer science / software engineering resume.
Use the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]"

Company: {company}
Duration: {duration}
Target role: {target_role}
Job context: {job_context}

Existing bullet points (improve and rearrange these; only add new ones if there are clear gaps):
{existing_text}

Rules:
- If existing bullets are already strong, reorder them to best match the target role and return them with minor edits
- Add 1-2 new bullets only if there are clear gaps in coverage
- Use strong technical action verbs (Engineered, Implemented, Optimized, Reduced, Scaled, etc.)
- Quantify with metrics where possible (%, latency ms, throughput, team size, etc.)
- Return 3-5 bullets total, ordered best-to-worst fit for the target role
- Return ONLY the refined bullets as a list in the `bullets` field — no dash, no symbol prefix"""

    llm = _get_llm().with_structured_output(WorkExperienceOutput)
    result: WorkExperienceOutput = _invoke(llm, prompt)
    return "\n".join(result.bullets)


@_rate_limit_retry
def generate_project_description(project_name: str, context: str) -> str:
    prompt = f"""Write a concise project description (max 180 characters) for a resume.

Project name: {project_name}

{context}

Rules:
- Describe what was built + tech stack used + the impact or problem solved
- Relevant to the target role if context is provided
- Max 180 characters
- Return ONLY the description in the `description` field"""

    llm = _get_llm().with_structured_output(ProjectDescriptionOutput)
    result: ProjectDescriptionOutput = _invoke(llm, prompt)
    return result.description[:180]


@_rate_limit_retry
def generate_skills_suggestion(job_context: str, skill_pool: list[str]) -> str:
    skills_list = "\n".join(f"- {s}" for s in skill_pool)

    prompt = f"""Organize the following skills into logical categories for a software engineering resume.

Target role context: {job_context}

Available skills (use ONLY from this list):
{skills_list}

Rules:
- Create 2-5 categories relevant to the role (e.g. "Frontend", "Backend", "Cloud & DevOps", "Languages", "Tools")
- Every skill must appear in exactly one category
- Order categories from most to least relevant to the target role
- Return the categories in the `categories` field"""

    llm = _get_llm().with_structured_output(SkillsOutput)
    result: SkillsOutput = _invoke(llm, prompt)
    return json.dumps([{"name": c.name, "skills": c.skills} for c in result.categories])
