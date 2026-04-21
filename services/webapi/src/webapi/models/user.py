from uuid import UUID

from pydantic import BaseModel, Field


class EducationItem(BaseModel):
    id: str = ""
    school: str = ""
    degree: str = ""
    year: str = ""
    description: str = ""


class LanguageItem(BaseModel):
    id: str = ""
    language: str = ""
    level: str = ""


class SkillTypeItem(BaseModel):
    id: str = ""
    name: str = ""
    skills: list[str] = Field(default_factory=list)


class ProfileSettings(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    github: str = ""
    linkedin: str = ""


class UserData(BaseModel):
    profile: ProfileSettings = Field(default_factory=ProfileSettings)
    education: list[EducationItem] = Field(default_factory=list)
    skillPool: list[str] = Field(default_factory=list)
    languages: list[LanguageItem] = Field(default_factory=list)
    experienceContext: str = ""
    applicationContext: str = ""


class UserDataPatch(BaseModel):
    profile: ProfileSettings | None = None
    education: list[EducationItem] | None = None
    skillPool: list[str] | None = None
    languages: list[LanguageItem] | None = None
    experienceContext: str | None = None
    applicationContext: str | None = None


class UserUpsertRequest(BaseModel):
    data: UserDataPatch = Field(default_factory=UserDataPatch)


class UserResponse(BaseModel):
    user_id: UUID
    data: UserData | None

    model_config = {"from_attributes": True}
