import uuid
from datetime import datetime

from browser_use import BrowserSession
from langgraph.types import Command
from sqlalchemy.orm import Session

from common.logging_config import get_logger
from db import ApplicationSession, Posting
from job_applier.browser_session import load_browser_session
from job_applier.graph import build_graph
from job_applier.nodes import ApplierNodes

logger = get_logger(__name__)

_HEADLESS = False  # set True for headless production mode


def _posting_url(posting: Posting) -> str:
    data = posting.data or {}
    return data.get("url", "")


def _user_credentials(user_data: dict) -> dict:
    return {
        "email": user_data.get("applicationEmail", ""),
        "password": user_data.get("applicationPassword", ""),
    }


async def process_application(
    posting_id: str,
    user_id: str,
    db: Session,
    checkpointer,
) -> None:
    posting = db.get(Posting, uuid.UUID(posting_id))
    if posting is None:
        raise ValueError(f"Posting {posting_id} not found")

    from db import User  # local import avoids circular at module level
    user = db.get(User, uuid.UUID(user_id))
    if user is None:
        raise ValueError(f"User {user_id} not found")

    user_data: dict = user.data or {}
    session_id = str(uuid.uuid4())

    app_session = ApplicationSession(
        session_id=uuid.UUID(session_id),
        posting_id=uuid.UUID(posting_id),
        user_id=uuid.UUID(user_id),
        thread_id=session_id,
        status="running",
    )
    db.add(app_session)
    db.commit()

    bu_session = BrowserSession(headless=_HEADLESS)

    try:
        nodes = ApplierNodes(session=bu_session)
        graph = build_graph(nodes, checkpointer)

        initial_state = {
            "posting_id": posting_id,
            "user_id": user_id,
            "session_id": session_id,
            "job_url": _posting_url(posting),
            "user_profile": user_data,
            "resume_pdf_key": user_data.get("resumePdfKey", ""),
            "credentials": _user_credentials(user_data),
            "browser_session_key": "",
            "current_url": "",
            "unknown_fields": [],
            "questions": [],
            "answers": {},
            "status": "running",
            "error": None,
        }

        result = await graph.ainvoke(
            initial_state,
            config={"configurable": {"thread_id": session_id}},
        )

        if result.get("questions"):
            app_session.status = "awaiting_input"
            app_session.pending_questions = {
                "session_id": session_id,
                "posting_id": posting_id,
                "questions": result["questions"],
            }
            logger.info(f"[process_application] paused awaiting input — session_id={session_id}")
        else:
            app_session.status = result.get("status", "completed")
            if posting.data:
                posting.data = {**posting.data, "status": "Applied"}
            logger.info(f"[process_application] completed — posting_id={posting_id}")

        app_session.updated_at = datetime.utcnow()
        db.commit()

    except Exception as exc:
        logger.exception(f"[process_application] failed posting_id={posting_id}")
        app_session.status = "failed"
        app_session.error = str(exc)
        app_session.updated_at = datetime.utcnow()
        db.commit()
        raise
    finally:
        try:
            await bu_session.close()
        except Exception:
            pass


async def resume_application(
    session_id: str,
    answers: dict,
    db: Session,
    checkpointer,
) -> None:
    app_session = db.get(ApplicationSession, uuid.UUID(session_id))
    if app_session is None:
        raise ValueError(f"ApplicationSession {session_id} not found")

    posting_id = str(app_session.posting_id)

    # Restore browser cookies from MinIO if available
    saved_state = load_browser_session(session_id)
    bu_session = BrowserSession(headless=_HEADLESS, storage_state=saved_state)

    try:
        nodes = ApplierNodes(session=bu_session)
        graph = build_graph(nodes, checkpointer)

        result = await graph.ainvoke(
            Command(resume=answers),
            config={"configurable": {"thread_id": app_session.thread_id}},
        )

        app_session.status = result.get("status", "completed")
        app_session.pending_questions = None
        app_session.updated_at = datetime.utcnow()

        if app_session.status == "completed":
            posting = db.get(Posting, app_session.posting_id)
            if posting and posting.data:
                posting.data = {**posting.data, "status": "Applied"}
            logger.info(f"[resume_application] completed — session_id={session_id}")

        db.commit()

    except Exception as exc:
        logger.exception(f"[resume_application] failed session_id={session_id}")
        app_session.status = "failed"
        app_session.error = str(exc)
        app_session.updated_at = datetime.utcnow()
        db.commit()
        raise
    finally:
        try:
            await bu_session.close()
        except Exception:
            pass
