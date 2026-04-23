import json, os
from dotenv import load_dotenv
from langchain_openrouter import ChatOpenRouter
from typing import Optional, List
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from openrouter.errors.toomanyrequestsresponse_error import TooManyRequestsResponseError

class ExtractedJobPostingDetails(BaseModel):
    posting_id: Optional[str] = Field(
        default=None,
        description="Internal identifier for the posting like jobid in url."
    )
    external_id: Optional[str] = Field(
        default=None,
        description="External identifier for the posting. Usually a field on the page with particular company id"
    )
    position_name: str = Field(description="Title of the job position.")
    company_name: str = Field(description="Name of the company.")
    posting_date: Optional[datetime] = Field(
        default=None,
        description="Posting date in ISO 8601 date-time format."
    )
    deadline: Optional[datetime] = Field(
        default=None,
        description="Application deadline in ISO 8601 date-time format."
    )
    description: str = Field(description="Full job description.")
    salary: Optional[str] = Field(default=None, description="Salary value or salary range string with notation on currency and hourly/yearly.")
    employmentType: Optional[str] = Field(default=None, description="Fulltime/coop/contract etc.")
    location: Optional[str] = Field(default=None, description="Either a location like city or remote.")
    relevant_skills: List[str] = Field(
        description="List of relevant skills for the role.",
    )
    
class FoundCompanyDetails(BaseModel):
    company_name: str = Field(description="Name of the company.")
    description: str = Field(description="relevant for job search and application proccess information about a company.")
    company_logo_url: str = Field(
        default=None,
        description="URL to the company logo"
    )


def load_schema(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_llm(model:str = "google/gemini-3.1-flash-lite-preview"):
    load_dotenv()
    api_key = os.getenv("OPEN_ROUTER_SK")
    if not api_key:
        raise ValueError("OPEN_ROUTER_SK is not set in .env")

    return ChatOpenRouter(
        model=model,
        api_key=api_key,
        temperature=0,
    )
    
def get_simple_llm():
    return get_llm("google/gemini-3.1-flash-lite-preview")

def get_better_llm():
    return get_llm("openai/gpt-5.3-chat")

_rate_limit_retry = retry(
    retry=retry_if_exception_type(TooManyRequestsResponseError),
    wait=wait_exponential(multiplier=2, min=10, max=120),
    stop=stop_after_attempt(4),
    reraise=True,
)

@_rate_limit_retry
def extract_posting_details(text: str) -> ExtractedJobPostingDetails:
    llm = get_simple_llm().with_structured_output(ExtractedJobPostingDetails)

    result = llm.invoke(
        "Extract this into the provided job posting schema, posting_id is a jobboard id is a id on the job board, external id is different quique internal to the company id:\n\n" + text
    )
    return result

@_rate_limit_retry
def search_company_details(company_name: str) -> FoundCompanyDetails:
    researcher = get_simple_llm().bind(
        tools=[
            {
                "type": "openrouter:web_search",
                "parameters": {"max_results": 5},
            }
        ]
    )

    research_text = researcher.invoke(
        f"Search the web for company information relevant to a job applicant about {company_name}. "
        "Summarize the company mission, product/business, size/stage if available, culture signals, recent news, "
        "and anything useful for tailoring an application."
    )

    extractor = get_simple_llm().with_structured_output(FoundCompanyDetails)

    return extractor.invoke(
        "Extract the following research into the schema.\n\n"
        f"Company name: {company_name}\n\n"
        f"Research:\n{research_text.content}"
    )
    
def generate_summary(
    posting_details: ExtractedJobPostingDetails,
    personal_summary: str,
    company_details: str,
):
    posting_text = json.dumps(posting_details.model_dump(mode="json"), indent=2)

    prompt = f"""
                Summarize this job posting. Estimate job fit based on my personal summary. Provide EXTREMELY HONEST matching score based on matching stack and level of seniority
                Keep response short and consise

                Job posting:
                {posting_text}

                Personal summary:
                {personal_summary}

                Company details:
                {company_details}

                Also explain:
                - what should be included in the resume for this particular position
                - what is not worth including in the resume for this particular position
                
                DO NOT give generic resume advise
                """

    return get_better_llm().invoke(prompt).content