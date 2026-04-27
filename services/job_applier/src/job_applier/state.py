from typing import TypedDict


class ApplierState(TypedDict):
    posting_id: str
    user_id: str
    session_id: str
    job_url: str
    user_profile: dict
    resume_pdf_key: str
    credentials: dict          # {"email": str, "password": str}
    browser_session_key: str   # MinIO key for saved Playwright storage_state
    current_url: str           # URL at time of interrupt (for resume navigation)
    unknown_fields: list[dict]
    questions: list[dict]      # formatted HITL questions saved to DB
    answers: dict              # user-provided answers keyed by question id
    status: str                # "running" | "awaiting_input" | "completed" | "failed"
    error: str | None
