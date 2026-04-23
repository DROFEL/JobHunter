from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Header, HTTPException
from db import get_fastapi_db
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from webapi.routes.user import router as users_router
from webapi.routes.profileSettings import router as profileSettings_router
from webapi.routes.resumeTemplates import router as resumeTemplates_router
from webapi.routes.jobs import router as jobs_router
from webapi.routes.ai import router as ai_router
from typing import Annotated
from alembic.config import Config
from alembic import command


def run_migrations() -> None:
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")


@asynccontextmanager
async def lifespan(_: FastAPI):
    run_migrations()
    yield


app = FastAPI(title="JobHunter API", lifespan=lifespan)

def get_external_user_id(
    Authentication: Annotated[str | None, Header()] = None,
) -> str:
    if not Authentication:
        raise HTTPException(status_code=401, detail="Missing Authentication header")
    return Authentication

DBSession = Annotated[Session, Depends(get_fastapi_db)]
ExternalUserId = Annotated[str, Depends(get_external_user_id)]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(profileSettings_router)
app.include_router(resumeTemplates_router)
app.include_router(jobs_router)
app.include_router(ai_router)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}