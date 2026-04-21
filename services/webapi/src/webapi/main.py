from fastapi import FastAPI
from db import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from webapi.routes.user import router as users_router
from webapi.routes.profileSettings import router as profileSettings_router
from webapi.routes.resumeTemplates import router as resumeTemplates_router
from webapi.routes.jobs import router as jobs_router
from webapi.routes.ai import router as ai_router

Base.metadata.create_all(bind=engine)
app = FastAPI(title="JobHunter API")

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