from typing import Literal

from pydantic import BaseModel, Field, HttpUrl


JobStatus = Literal["Found", "Applied", "Interview", "Offer", "Rejected"]


class WorkPoint(BaseModel):
    id: str = Field(min_length=1)
    text: str = Field(min_length=1)


class ProjectItem(BaseModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str = Field(min_length=1)


class ExperienceItem(BaseModel):
    id: str = Field(min_length=1)
    company: str = Field(min_length=1)
    duration: str = Field(min_length=1)
    points: list[WorkPoint] = Field(default_factory=list)


class JobResume(BaseModel):
    position: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    targetPosition: str = Field(min_length=1)
    targetCompany: str = Field(min_length=1)
    jobPostingLink: HttpUrl
    aiJobSummary: str = Field(min_length=1)
    experiences: list[ExperienceItem] = Field(default_factory=list)
    projects: list[ProjectItem] = Field(default_factory=list)


class SavedJobData(BaseModel):
    title: str = Field(min_length=1)
    company: str = Field(min_length=1)
    location: str = Field(min_length=1)
    posted: str = Field(min_length=1)
    salary: str = Field(min_length=1)
    employmentType: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    url: HttpUrl
    saved: bool
    status: JobStatus
    resume: JobResume


class SavedJobCreateRequest(BaseModel):
    data: SavedJobData


class SavedJobResponse(BaseModel):
    posting_id: str
    data: SavedJobData | None
    status: str | None

    model_config = {"from_attributes": True}