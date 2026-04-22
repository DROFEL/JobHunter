from typing import Literal, Optional
from pydantic import BaseModel, Field


JobStatus = Literal["Found", "Applied", "Interview", "Offer", "Rejected"]
JOB_STATUSES: list[JobStatus] = ["Found", "Applied", "Interview", "Offer", "Rejected"]


class WorkPoint(BaseModel):
    id: str
    text: str


class ProjectItem(BaseModel):
    id: str
    name: str = ""
    description: str = ""


class ExperienceItem(BaseModel):
    id: str
    company: str = ""
    duration: str = ""
    points: list[WorkPoint] = Field(default_factory=list)


class SkillTypeItem(BaseModel):
    id: str
    name: str = ""
    skills: list[str] = Field(default_factory=list)


class JobResume(BaseModel):
    model_config = {"extra": "allow"}

    position: str = ""
    summary: str = ""
    targetPosition: str = ""
    targetCompany: str = ""
    jobPostingLink: str = ""
    aiJobSummary: str = ""
    experiences: list[ExperienceItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)
    skillTypes: list[SkillTypeItem] = Field(default_factory=list)
    enabledLanguageIds: list[str] = Field(default_factory=list)


class PostingData(BaseModel):
    model_config = {"extra": "allow"}

    title: str = ""
    company: str = ""
    location: str = ""
    posted: str = ""
    salary: str = ""
    employmentType: str = ""
    summary: str = ""
    url: str = ""
    deadline: str = ""
    saved: bool = False
    status: JobStatus = "Found"
    resume: Optional[JobResume] = None

    @classmethod
    def from_db(cls, raw: dict | None) -> "PostingData":
        return cls.model_validate(raw or {})

    def to_db(self) -> dict:
        return self.model_dump(mode="json")
