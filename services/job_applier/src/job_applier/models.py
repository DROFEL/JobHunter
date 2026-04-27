from typing import Literal

from pydantic import BaseModel


class UnknownField(BaseModel):
    field_name: str
    field_label: str
    field_type: Literal["text", "select", "file", "checkbox", "radio"]
    description: str
    options: list[str] | None = None


class FormFillResult(BaseModel):
    filled_fields: list[str]
    unknown_fields: list[UnknownField]
    current_url: str


class ApplicationQuestion(BaseModel):
    id: str
    question: str
    type: Literal["text", "select"]
    options: list[str] | None = None


class HITLPayload(BaseModel):
    session_id: str
    posting_id: str
    questions: list[ApplicationQuestion]
