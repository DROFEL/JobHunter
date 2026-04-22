import asyncio
from db.session import get_db
from db.models import Posting, Company, User
from common.logging_config import setup_logging, get_logger
from common.models import PostingData
from common.minio import client
from job_scraper.scrape_text import fetch_and_clean
from job_scraper.process import extract_posting_details, search_company_details, generate_summary

def process_scrape_request(url: str, posting_id: str):
    logger = get_logger(__name__)
    with get_db() as db:
        posting = db.query(Posting).filter(Posting.posting_id == posting_id).first()
        if posting is None:
            logger.error(f"Posting with posting_id {posting_id} is not in a database. Terminating job")
            return
        logger.info(f"Started scraping job for posting_id {posting_id} at {url}")
        posting.scrapeStatus = "Started"
        db.commit()

        try:
            text = asyncio.run(fetch_and_clean(url))
            setup_logging()
            logger.info(f"Finished fetching")
            posting_details = extract_posting_details(text)
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
        except Exception as e:
            posting.scrapeStatus = "Failed"
            db.commit()
            logger.exception(f"Failed job for posting_id {posting_id} at {url}")
            return
