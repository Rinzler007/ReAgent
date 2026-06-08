"""Pydantic models for the ingest and read APIs."""
from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# ── Ingest (write) models ────────────────────────────────────────────────────

class SpanIn(BaseModel):
    id: UUID
    parent_span_id: UUID | None = None
    kind: str                          # llm_call | tool_call | node | graph
    name: str
    started_at: datetime
    finished_at: datetime | None = None
    input: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any] = Field(default_factory=dict)
    error: str | None = None


class RunIn(BaseModel):
    id: UUID
    parent_run_id: UUID | None = None
    agent_name: str
    status: str = "completed"
    started_at: datetime
    finished_at: datetime | None = None
    total_tokens: int | None = None
    total_cost_usd: float | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    spans: list[SpanIn] = Field(default_factory=list)


# ── Read models ──────────────────────────────────────────────────────────────

class SpanOut(SpanIn):
    run_id: UUID


class RunOut(BaseModel):
    id: UUID
    parent_run_id: UUID | None
    agent_name: str
    status: str
    started_at: datetime
    finished_at: datetime | None
    total_tokens: int | None
    total_cost_usd: float | None
    metadata: dict[str, Any]
    span_count: int = 0


class RunDetail(RunOut):
    spans: list[SpanOut] = Field(default_factory=list)


# ── Replay models ────────────────────────────────────────────────────────────

class ReplayIn(BaseModel):
    new_run_id: UUID
    summary: dict[str, Any] = Field(default_factory=dict)


class ReplayDiffOut(BaseModel):
    id: UUID
    original_run_id: UUID
    replay_run_id: UUID
    divergence_span_id: UUID | None
    summary: dict[str, Any]
    created_at: datetime
