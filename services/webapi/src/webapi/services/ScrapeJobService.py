from ..producer import producer, delivery_report
from db.session import get_db
from db.models import Posting

def fetch_posting(url: str, posting_id: str) -> bool:
    try:
        with get_db() as db:
            posting = db.query(Posting).filter(Posting.posting_id == posting_id).first()
            if posting is None:
                return
            posting.scrapeStatus = "Queued"
            db.commit()
        producer.produce(topic="scrape_jobs", key=posting_id, value=url, on_delivery=delivery_report)
        undelivered = producer.flush(timeout=10)
        if undelivered > 0:
            with get_db() as db:
                posting = db.query(Posting).filter(Posting.posting_id == posting_id).first()
                posting.scrapeStatus = "Failed"
                db.commit()
            print(f"[kafka] {undelivered} message(s) not delivered after flush")
            return False
        return True
    except Exception as e:
        print(f"[kafka] produce error: {e}")
        return False