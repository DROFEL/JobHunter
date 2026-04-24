import asyncio
import json
from typing import Callable
from uuid import UUID

from common.logging_config import get_logger
from db.models import Posting
from db.session import get_db
from job_scraper.producer import delivery_report, producer
from job_scraper.scrapers import linkedin_list_fetcher
from job_scraper.scrapers.linkedin_list_fetcher import DiscoveredPosting

ListFetcher = Callable[[str], list[DiscoveredPosting]]

LIST_FETCHERS: dict[str, ListFetcher] = {
    "linkedin": linkedin_list_fetcher.fetch,
}


async def handle_search(payload: dict) -> None:
    logger = get_logger(__name__)
    board = payload.get("board")
    search_url = payload.get("search_url")
    user_id_raw = payload.get("user_id")

    if not (board and search_url and user_id_raw):
        logger.error(f"Invalid searches.discover payload: {payload}")
        return

    fetcher = LIST_FETCHERS.get(board)
    if fetcher is None:
        logger.error(f"No list fetcher for board={board}")
        return

    user_id = UUID(user_id_raw)
    logger.info(f"Discovering postings for board={board} user_id={user_id}")

    loop = asyncio.get_event_loop()
    discovered = await loop.run_in_executor(None, lambda: fetcher(search_url))
    logger.info(f"Fetched {len(discovered)} cards from {board}")

    for card in discovered:
        posting_id = _upsert_posting(user_id=user_id, card=card)
        if posting_id is None:
            continue
        producer.produce(
            topic="postings.scrape",
            key=str(posting_id),
            value=json.dumps({"url": card.url, "attempt": 0}),
            on_delivery=delivery_report,
        )
    producer.flush(timeout=10)


def _upsert_posting(user_id: UUID, card: DiscoveredPosting) -> UUID | None:
    """Returns posting_id to enqueue, or None if the row should be skipped."""
    logger = get_logger(__name__)
    with get_db() as db:
        existing = (
            db.query(Posting)
            .filter(Posting.user_id == user_id, Posting.board_id == card.board_id)
            .first()
        )
        if existing is not None:
            if existing.scrapeStatus == "Complete":
                return None
            if existing.scrapeStatus in ("Queued", "Started"):
                return None
            if existing.scrapeStatus == "Failed":
                logger.info(
                    f"Skipping previously-failed posting {existing.posting_id} "
                    f"(board={card.board_id}); admin action required to retry"
                )
                return None
            existing.scrapeStatus = "Queued"
            db.commit()
            return existing.posting_id

        posting = Posting(
            user_id=user_id,
            board_id=card.board_id,
            scrapeStatus="Queued",
            data={
                "title": card.title or "",
                "company": card.company or "",
                "url": card.url,
            },
        )
        db.add(posting)
        db.commit()
        db.refresh(posting)
        return posting.posting_id
