import asyncio
import json
import logging
from common.logging_config import setup_logging

from common.logging_config import get_logger
from common.models import PostingData
from db.models import Company, Posting, User
from db.session import get_db
from job_scraper.fetcher import fetch_page
from job_scraper.process import extract_posting_details, generate_summary, search_company_details
from job_scraper.producer import delivery_report, producer

MAX_ATTEMPTS = 5
RETRY_DELAY_SECONDS = 5


class _SoftSkip(Exception):
    """Non-retryable: page not scrape-able (authwall, empty content, etc.)."""


async def process_scrape_request(url: str, posting_id: str, attempt: int = 0):
    logger = get_logger(__name__)
    with get_db() as db:
        posting = db.query(Posting).filter(Posting.posting_id == posting_id).first()
        if posting is None:
            logger.error(f"Posting with posting_id {posting_id} is not in a database. Terminating job")
            return
        logger.info(f"Started scraping job for posting_id {posting_id} at {url} (attempt {attempt})")
        posting.scrapeStatus = "Started"
        posting.attempt = attempt
        db.commit()

        try:
            fetch_result = await fetch_page(url)
            if not fetch_result.llm_text:
                raise _SoftSkip("empty llm_text")
            setup_logging(level=logging.DEBUG)
            logger.debug(f"Fetch result: {fetch_result}")
            logger.info(f"Finished fetching")
            posting_details = extract_posting_details(fetch_result.llm_text)
            logger.debug(f"Posting details: {posting_details}")
            if fetch_result.pre_extracted:
                from datetime import datetime
                pre = fetch_result.pre_extracted
                overrides = {}
                if pre.title and pre.title != "N/A":
                    overrides["position_name"] = pre.title
                if pre.company and pre.company != "N/A":
                    overrides["company_name"] = pre.company
                if pre.location:
                    overrides["location"] = pre.location
                if pre.salary:
                    overrides["salary"] = pre.salary
                if pre.job_type:
                    overrides["employmentType"] = pre.job_type
                if pre.date_posted:
                    overrides["posting_date"] = datetime(pre.date_posted.year, pre.date_posted.month, pre.date_posted.day)
                posting_details = posting_details.model_copy(update=overrides)
            logger.info(f"Finished extraction")

            company = db.query(Company).filter(Company.name == posting_details.company_name).first()
            if company is None:
                logger.info(f"Company information for {posting_details.company_name} is not in a database, starting research")
                company_details = search_company_details(posting_details.company_name)
                logger.info(f"Company research done")
                company = Company(
                    name=posting_details.company_name,
                    context=company_details.description,
                    logo=company_details.company_logo_url,
                )
                db.add(company)
                db.commit()
                db.refresh(company)

            user = db.query(User).filter(User.user_id == posting.user_id).first()
            if user is None:
                logger.critical(f"User with id {posting.user_id} not found")
                return

            logger.info(f"Started summary generation")
            summary = generate_summary(posting_details, user.data['experienceContext'], company.context)
            logger.debug(f"Summary: {summary}")
            logger.info(f"Summary generation done")

            posting.company_id = company.company_id
            posting.board_id = posting_details.posting_id
            posting.external_id = posting_details.external_id
            posting.scrapeStatus = "Complete"

            posting.data = PostingData(
                title=posting_details.position_name,
                company=company.name,
                location=posting_details.location or "",
                posted=posting_details.posting_date.isoformat() if posting_details.posting_date else "",
                deadline=posting_details.deadline.isoformat() if posting_details.deadline else "",
                salary=posting_details.salary or "",
                employmentType=posting_details.employmentType or "",
                summary=summary,
                url=url,
            ).to_db()

            db.commit()
            logger.info(f"Successfully completed scraping job posting")
        except _SoftSkip as e:
            posting.scrapeStatus = "Failed"
            db.commit()
            logger.info(f"Soft-skip for posting_id {posting_id}: {e}")
        except Exception as e:
            next_attempt = attempt + 1
            if next_attempt < MAX_ATTEMPTS:
                posting.scrapeStatus = "Queued"
                db.commit()
                logger.exception(
                    f"Transient failure for posting_id {posting_id} at {url} "
                    f"(attempt {attempt}); requeueing as attempt {next_attempt}"
                )
                await asyncio.sleep(RETRY_DELAY_SECONDS)
                producer.produce(
                    topic="postings.scrape",
                    key=str(posting_id),
                    value=json.dumps({"url": url, "attempt": next_attempt}),
                    on_delivery=delivery_report,
                )
                producer.flush(timeout=10)
            else:
                posting.scrapeStatus = "Failed"
                db.commit()
                logger.exception(
                    f"Terminal failure for posting_id {posting_id} at {url} "
                    f"after {attempt} attempts; publishing to DLQ"
                )
                producer.produce(
                    topic="postings.scrape.dlq",
                    key=str(posting_id),
                    value=json.dumps({
                        "url": url,
                        "attempts": attempt,
                        "last_error": repr(e),
                    }),
                    on_delivery=delivery_report,
                )
                producer.flush(timeout=10)
