import asyncio
import json
from datetime import datetime, timezone
from typing import Callable
from urllib.parse import urlencode
from uuid import UUID

from common.logging_config import get_logger
from db.models import Posting
from db.models.search_config import SearchConfig
from db.session import get_db
from job_scraper.producer import delivery_report, producer, trace_headers
from job_scraper.scrapers import linkedin_list_fetcher
from job_scraper.scrapers.linkedin_list_fetcher import DiscoveredPosting

ListFetcher = Callable[[str, int], list[DiscoveredPosting]]

_BOARD_BASE_URLS: dict[str, str] = {
    "linkedin": "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search",
}

LIST_FETCHERS: dict[str, ListFetcher] = {
    "linkedin": linkedin_list_fetcher.fetch,
}


async def handle_search(payload: dict) -> None:
    logger = get_logger(__name__)
    raw_id = payload.get("search_config_id")
    if not raw_id:
        logger.error(f"Missing search_config_id in payload: {payload}")
        return

    search_config_id = UUID(raw_id)

    with get_db() as db:
        cfg = db.query(SearchConfig).filter(SearchConfig.search_config_id == search_config_id).first()
        if cfg is None:
            logger.error(f"SearchConfig not found: {search_config_id}")
            return
        board = cfg.board
        params = cfg.params or {}
        results_wanted = cfg.results_wanted

    fetcher = LIST_FETCHERS.get(board)
    base_url = _BOARD_BASE_URLS.get(board)
    if fetcher is None or base_url is None:
        logger.error(f"No list fetcher for board={board}")
        _update_config_status(search_config_id, "Failed", 0)
        return

    search_url = f"{base_url}?{urlencode(params)}" if params else base_url
    logger.info(f"Discovering postings for board={board} config={search_config_id} url={search_url}")

    loop = asyncio.get_event_loop()
    try:
        discovered = await loop.run_in_executor(None, lambda: fetcher(search_url, results_wanted))
    except Exception:
        logger.exception(f"List fetcher failed for config={search_config_id}")
        _update_config_status(search_config_id, "Failed", 0)
        raise

    logger.info(f"Fetched {len(discovered)} cards from {board}")

    with get_db() as db:
        cfg = db.query(SearchConfig).filter(SearchConfig.search_config_id == search_config_id).first()
        if cfg is None:
            logger.error(f"SearchConfig disappeared mid-run: {search_config_id}")
            return
        user_id = cfg.user_id

    new_count = 0
    for card in discovered:
        posting_id = _upsert_posting(user_id=user_id, card=card)
        if posting_id is None:
            continue
        new_count += 1
        producer.produce(
            topic="postings.scrape",
            key=str(posting_id),
            value=json.dumps({"url": card.url, "attempt": 0}),
            headers=trace_headers(),
            on_delivery=delivery_report,
        )
    producer.flush(timeout=10)

    _update_config_status(search_config_id, "Complete", new_count)


def _update_config_status(search_config_id: UUID, status: str, scraped_last_run: int) -> None:
    with get_db() as db:
        cfg = db.query(SearchConfig).filter(SearchConfig.search_config_id == search_config_id).first()
        if cfg is None:
            return
        cfg.status = status
        cfg.scraped_last_run = scraped_last_run
        cfg.scraped_total += scraped_last_run
        cfg.updated_at = datetime.now(timezone.utc)
        db.commit()


def _upsert_posting(user_id: UUID, card: DiscoveredPosting) -> UUID | None:
    logger = get_logger(__name__)
    with get_db() as db:
        # Pass 1: look up by board_id (handles both auto and manual postings that already have one)
        by_board = (
            db.query(Posting)
            .filter(Posting.user_id == user_id, Posting.board_id == card.board_id)
            .first()
        )
        if by_board is not None:
            if by_board.source != "manual":
                # Auto-discovered: never override, skip silently
                return None
            # Manual posting already linked to this board_id — enrich if not yet scraped
            return _enrich_manual(db, by_board, card, logger)

        # Pass 2: look up manual postings by URL (not yet linked to a board_id)
        by_url = (
            db.query(Posting)
            .filter(
                Posting.user_id == user_id,
                Posting.board_id.is_(None),
                Posting.source == "manual",
                Posting.data["url"].as_string() == card.url,
            )
            .first()
        )
        if by_url is not None:
            by_url.board_id = card.board_id
            db.flush()
            return _enrich_manual(db, by_url, card, logger)

        # Not found: create a new auto-discovered posting
        posting = Posting(
            user_id=user_id,
            board_id=card.board_id,
            source="auto",
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


def _enrich_manual(db, posting: Posting, card: DiscoveredPosting, logger) -> UUID | None:
    if posting.scrapeStatus in ("Complete", "Queued", "Started"):
        return None
    if posting.scrapeStatus == "Failed":
        logger.info(
            f"Skipping previously-failed manual posting {posting.posting_id} "
            f"(board={card.board_id}); admin action required to retry"
        )
        return None
    # Update only fields where the card has a real value — never overwrite with empty
    data = dict(posting.data or {})
    if card.title:
        data.setdefault("title", card.title)
    if card.company:
        data.setdefault("company", card.company)
    data["url"] = card.url
    posting.data = data
    posting.scrapeStatus = "Queued"
    db.commit()
    db.refresh(posting)
    return posting.posting_id
