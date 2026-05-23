"""
ReAgent SDK recorder.

Usage:
    recorder = Recorder(agent_name="my-agent")

    with recorder.run() as run:
        with run.span("graph", kind="graph") as graph_span:
            with graph_span.child("researcher_node", kind="node") as node_span:
                with node_span.child("call_llm", kind="llm_call",
                                     input={"prompt": "..."}) as llm_span:
                    result = call_llm(...)
                    llm_span.set_output({"text": result})
"""
from __future__ import annotations

import threading
import traceback
from contextlib import contextmanager
from datetime import datetime, timezone
from typing import Any, Generator
from uuid import UUID, uuid4

import httpx


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Span:
    """A single recorded span inside a run."""

    def __init__(
        self,
        name: str,
        kind: str,
        run_id: UUID,
        parent_span_id: UUID | None = None,
        input: dict[str, Any] | None = None,
    ):
        self.id: UUID = uuid4()
        self.run_id = run_id
        self.parent_span_id = parent_span_id
        self.kind = kind
        self.name = name
        self.started_at: datetime = _now()
        self.finished_at: datetime | None = None
        self.input: dict[str, Any] = input or {}
        self.output: dict[str, Any] = {}
        self.error: str | None = None
        self._children: list[Span] = []
        self._lock = threading.Lock()

    def set_output(self, output: dict[str, Any]) -> None:
        self.output = output

    @contextmanager
    def child(
        self,
        name: str,
        kind: str,
        input: dict[str, Any] | None = None,
    ) -> Generator[Span, None, None]:
        """Create a child span scoped to a with-block."""
        span = Span(name=name, kind=kind, run_id=self.run_id,
                    parent_span_id=self.id, input=input)
        with self._lock:
            self._children.append(span)
        try:
            yield span
        except Exception as exc:
            span.error = traceback.format_exc()
            raise
        finally:
            span.finished_at = _now()

    def _flatten(self) -> list[Span]:
        """Return this span and all descendants in depth-first order."""
        result = [self]
        for child in self._children:
            result.extend(child._flatten())
        return result

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": str(self.id),
            "parent_span_id": str(self.parent_span_id) if self.parent_span_id else None,
            "kind": self.kind,
            "name": self.name,
            "started_at": self.started_at.isoformat(),
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "input": self.input,
            "output": self.output,
            "error": self.error,
        }


class Run:
    """Represents one complete agent run."""

    def __init__(
        self,
        agent_name: str,
        metadata: dict[str, Any] | None = None,
        parent_run_id: UUID | None = None,
    ):
        self.id: UUID = uuid4()
        self.agent_name = agent_name
        self.parent_run_id = parent_run_id
        self.status = "running"
        self.started_at = _now()
        self.finished_at: datetime | None = None
        self.total_tokens: int | None = None
        self.total_cost_usd: float | None = None
        self.metadata: dict[str, Any] = metadata or {}
        self._root_spans: list[Span] = []
        self._lock = threading.Lock()

    @contextmanager
    def span(
        self,
        name: str,
        kind: str,
        input: dict[str, Any] | None = None,
    ) -> Generator[Span, None, None]:
        """Create a top-level span for this run."""
        s = Span(name=name, kind=kind, run_id=self.id, input=input)
        with self._lock:
            self._root_spans.append(s)
        try:
            yield s
        except Exception as exc:
            s.error = traceback.format_exc()
            raise
        finally:
            s.finished_at = _now()

    def _all_spans(self) -> list[Span]:
        result = []
        for root in self._root_spans:
            result.extend(root._flatten())
        return result

    def to_payload(self) -> dict[str, Any]:
        return {
            "id": str(self.id),
            "parent_run_id": str(self.parent_run_id) if self.parent_run_id else None,
            "agent_name": self.agent_name,
            "status": self.status,
            "started_at": self.started_at.isoformat(),
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "total_tokens": self.total_tokens,
            "total_cost_usd": self.total_cost_usd,
            "metadata": self.metadata,
            "spans": [s.to_dict() for s in self._all_spans()],
        }


class Recorder:
    """
    Top-level entry point.

        recorder = Recorder(agent_name="my-agent", server_url="http://localhost:8000")

        with recorder.run() as run:
            with run.span("graph", kind="graph") as root:
                ...
    """

    def __init__(
        self,
        agent_name: str,
        server_url: str = "http://localhost:8000",
        timeout: float = 10.0,
    ):
        self.agent_name = agent_name
        self.server_url = server_url.rstrip("/")
        self.timeout = timeout

    @contextmanager
    def run(
        self,
        metadata: dict[str, Any] | None = None,
        parent_run_id: UUID | None = None,
    ) -> Generator[Run, None, None]:
        """
        Context manager for a full agent run. Automatically ships the run
        to the server when the block exits. Telemetry errors never propagate
        to the caller — your agent code always wins.
        """
        r = Run(agent_name=self.agent_name, metadata=metadata,
                parent_run_id=parent_run_id)
        try:
            yield r
            r.status = "completed"
        except Exception:
            r.status = "failed"
            raise
        finally:
            r.finished_at = _now()
            self._ship(r)

    def _ship(self, run: Run) -> None:
        """POST the run to the server. Fail silently so agent is never blocked."""
        try:
            payload = run.to_payload()
            with httpx.Client(timeout=self.timeout) as client:
                resp = client.post(f"{self.server_url}/v1/traces", json=payload)
                resp.raise_for_status()
        except Exception as exc:
            # Telemetry must never crash user code
            print(f"[reagent] Warning: failed to ship trace — {exc}")
