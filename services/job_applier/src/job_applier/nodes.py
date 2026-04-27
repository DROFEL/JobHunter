import json

from browser_use import Agent, BrowserSession
from langchain_openrouter import ChatOpenRouter
from langgraph.types import interrupt

from common.config import get_settings
from common.logging_config import get_logger
from job_applier.browser_session import save_browser_session
from job_applier.models import FormFillResult
from job_applier.state import ApplierState

logger = get_logger(__name__)


def _get_llm() -> ChatOpenRouter:
    return ChatOpenRouter(
        model="google/gemini-2.5-flash-preview",
        api_key=get_settings().open_router_sk,
    )


class ApplierNodes:
    def __init__(self, session: BrowserSession) -> None:
        self.session = session
        self.llm = _get_llm()

    async def navigate_and_auth(self, state: ApplierState) -> dict:
        """Navigate to the job URL and handle login/registration if required."""
        email = state["credentials"].get("email", "")
        password = state["credentials"].get("password", "")
        job_url = state["job_url"]

        task = (
            f"Navigate to this job posting URL: {job_url}\n"
            f"If the page shows a login form or requires authentication:\n"
            f"  1. Try to log in with email='{email}' and password='{password}'.\n"
            f"  2. If login fails (wrong credentials or no account exists), click 'Sign up' "
            f"     or 'Register' and create an account with the same email and password.\n"
            f"  3. Complete any visible verification steps.\n"
            f"Once authenticated (or if no auth is required), stop."
        )

        agent = Agent(task=task, llm=self.llm, browser=self.session)
        await agent.run(max_steps=30)
        logger.info(f"[navigate_and_auth] completed for posting={state['posting_id']}")
        return {}

    async def navigate_to_apply(self, state: ApplierState) -> dict:
        """Find and click the Apply button to reach the application form."""
        task = (
            "Find the 'Apply', 'Apply Now', or 'Apply for this job' button on the current page "
            "and click it. If the apply button leads to an external site, follow it."
        )

        agent = Agent(task=task, llm=self.llm, browser=self.session)
        await agent.run(max_steps=10)
        logger.info(f"[navigate_to_apply] completed for posting={state['posting_id']}")
        return {}

    async def fill_form(self, state: ApplierState) -> dict:
        """Fill known application form fields using user profile data."""
        profile_json = json.dumps(state["user_profile"], indent=2)

        task = (
            "You are filling out a job application form. Use the following applicant information:\n\n"
            f"{profile_json}\n\n"
            "Instructions:\n"
            "1. Fill every visible form field you can confidently match to the applicant data.\n"
            "2. For file upload fields (Resume, CV), skip them — handled separately.\n"
            "3. For any field you cannot fill (no matching data or fixed options not in profile), "
            "   list it in 'unknown_fields' with its label, type, and available options if any.\n"
            "4. Do NOT submit the form yet.\n"
            "Return a structured result."
        )

        agent = Agent(
            task=task,
            llm=self.llm,
            browser=self.session,
            output_model_schema=FormFillResult,
        )
        history = await agent.run(max_steps=50)
        result: FormFillResult | None = history.final_result()

        if result is None:
            logger.warning("[fill_form] agent returned no structured result")
            return {"unknown_fields": [], "current_url": ""}

        unknown_dicts = [f.model_dump() for f in result.unknown_fields]
        logger.info(
            f"[fill_form] posting={state['posting_id']} "
            f"filled={len(result.filled_fields)} unknown={len(unknown_dicts)}"
        )
        return {"unknown_fields": unknown_dicts, "current_url": result.current_url}

    async def save_and_interrupt(self, state: ApplierState) -> dict:
        """Save browser session to MinIO, build HITL questions, then interrupt for user input."""
        session_id = state["session_id"]

        # Persist browser cookies so the session can be restored on resume
        session_key = ""
        try:
            storage_state = await self.session.export_storage_state()
            session_key = save_browser_session(session_id, storage_state)
            logger.info(f"[save_and_interrupt] session saved key={session_key}")
        except Exception:
            logger.warning("[save_and_interrupt] could not export storage state", exc_info=True)

        # Convert unknown form fields to HITL question format
        questions = []
        for i, field in enumerate(state["unknown_fields"]):
            q_type = "select" if field.get("options") else "text"
            questions.append({
                "id": f"q{i}",
                "question": field.get("description") or field.get("field_label") or field.get("field_name"),
                "type": q_type,
                "options": field.get("options"),
            })

        logger.info(f"[save_and_interrupt] suspending with {len(questions)} question(s)")

        # Suspend graph; resumes when Command(resume=answers) is received
        answers: dict = interrupt(questions)

        logger.info(f"[save_and_interrupt] resumed with {len(answers)} answer(s)")
        return {
            "browser_session_key": session_key,
            "questions": questions,
            "answers": answers,
            "status": "running",
        }

    async def apply_answers(self, state: ApplierState) -> dict:
        """Navigate back to the form and fill in the user-provided answers."""
        current_url = state.get("current_url", "")
        answers = state.get("answers", {})
        questions = state.get("questions", [])

        qa_pairs = []
        for q in questions:
            answer = answers.get(q["id"], "")
            if answer:
                qa_pairs.append(f"Field '{q['question']}' → '{answer}'")

        nav = f"Navigate to: {current_url}\n" if current_url else "Return to the job application form.\n"
        task = (
            f"{nav}"
            "Fill in the following form fields with the exact values shown:\n"
            + "\n".join(qa_pairs)
            + "\nDo NOT submit the form yet."
        )

        agent = Agent(task=task, llm=self.llm, browser=self.session)
        await agent.run(max_steps=30)
        logger.info(f"[apply_answers] done for posting={state['posting_id']}")
        return {}

    async def submit_application(self, state: ApplierState) -> dict:
        """Submit the completed application form."""
        task = (
            "The job application form is fully filled out. "
            "Find and click the final Submit or Apply button to submit the application. "
            "Wait for a confirmation message."
        )

        agent = Agent(task=task, llm=self.llm, browser=self.session)
        await agent.run(max_steps=15)
        logger.info(f"[submit_application] submitted for posting={state['posting_id']}")
        return {"status": "completed"}
