import json, asyncio, os
from dotenv import load_dotenv
from langchain_openrouter import ChatOpenRouter
from job_scraper.scrape_text import fetch_and_clean, clean_html_for_llm


def load_schema(path: str) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_llm():
    load_dotenv()
    api_key = os.getenv("OPEN_ROUTER_SK")
    if not api_key:
        raise ValueError("OPEN_ROUTER_SK is not set in .env")

    return ChatOpenRouter(
        model="openai/gpt-4.1-mini",
        api_key=api_key,
        temperature=0,
    )


def main():
    schema = load_schema("src/job_scraper/posting_schema.json")
    llm = get_llm().with_structured_output(schema)

    text = asyncio.run(fetch_and_clean("https://www.linkedin.com/jobs/view/4404360495/"))

    result = llm.invoke(
        "Extract this into the provided job posting schema, posting_id is a jobboard id is a id on the job board, external id is different quique internal to the company id:\n\n" + text
    )
    print(result)


if __name__ == "__main__":
    main()