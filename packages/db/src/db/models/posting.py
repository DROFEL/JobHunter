from __future__ import annotations

from typing import TYPE_CHECKING, Any
from uuid import UUID

from sqlalchemy import ForeignKey, Index, Integer, Text, text
from sqlalchemy.dialects.postgresql import JSON, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.base import Base

if TYPE_CHECKING:
    from db.models.company import Company


class Posting(Base):
    __tablename__ = "postings_tbl"

    posting_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    external_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    company_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("company_tbl.company_id"),
        nullable=True,
    )
    user_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("user_tbl.user_id"),
        nullable=True,
    )
    board_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    data: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str | None] = mapped_column(Text, nullable=True)
    scrapeStatus: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempt: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("0"))

    company: Mapped["Company | None"] = relationship(back_populates="postings")

    __table_args__ = (
        Index(
            "ux_postings_user_board",
            "user_id",
            "board_id",
            unique=True,
            postgresql_where=text("board_id IS NOT NULL"),
        ),
    )