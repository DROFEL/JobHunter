from datetime import date
from typing import Optional

from pydantic import BaseModel


class FetchedPage(BaseModel):
    url: str
    html: str


class ScrapedJob(BaseModel):
    id: str
    title: str
    company: str
    company_url: Optional[str] = None
    company_logo: Optional[str] = None
    company_industry: Optional[str] = None
    location: Optional[str] = None
    is_remote: bool = False
    date_posted: Optional[date] = None
    job_url: str
    job_url_direct: Optional[str] = None
    salary: Optional[str] = None
    job_type: Optional[str] = None
    job_level: Optional[str] = None
    job_function: Optional[str] = None
    description: Optional[str] = None
    external_application: bool = False
