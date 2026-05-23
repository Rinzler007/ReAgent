"""
smoke_test.py — Verifies the full stack without Docker.

Prerequisites:
    pip install -e reagent_sdk/ -e reagent_server/ httpx pytest

Usage:
    # In one terminal: docker compose up (or start Postgres any way you like)
    # In another:
    DATABASE_URL=postgresql://reagent:reagent@localhost:5432/reagent \
    python scripts/smoke_test.py
"""
from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import httpx

BASE = os.getenv("REAGENT_SERVER_URL", "http://localhost:8000")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def test_health():
    r = httpx.get(f"{BASE}/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    print("✓ health")


def test_ingest_and_read():
    run_id = str(uuid.uuid4())
    graph_id = str(uuid.uuid4())
    node_id = str(uuid.uuid4())
    llm_id = str(uuid.uuid4())
    tool_id = str(uuid.uuid4())

    payload = {
        "id": run_id,
        "agent_name": "smoke-test-agent",
        "status": "completed",
        "started_at": _now(),
        "finished_at": _now(),
        "metadata": {"model": "fake-llm-v0"},
        "spans": [
            {
                "id": graph_id,
                "kind": "graph",
                "name": "agent_graph",
                "started_at": _now(),
                "finished_at": _now(),
                "input": {"question": "test?"},
                "output": {"summary": "test answer"},
            },
            {
                "id": node_id,
                "parent_span_id": graph_id,
                "kind": "node",
                "name": "researcher_node",
                "started_at": _now(),
                "finished_at": _now(),
                "input": {"question": "test?"},
                "output": {"research": "some research"},
            },
            {
                "id": llm_id,
                "parent_span_id": node_id,
                "kind": "llm_call",
                "name": "call_llm",
                "started_at": _now(),
                "finished_at": _now(),
                "input": {"prompt": "summarise..."},
                "output": {"text": "answer", "tokens": 42},
            },
            {
                "id": tool_id,
                "parent_span_id": node_id,
                "kind": "tool_call",
                "name": "web_search",
                "started_at": _now(),
                "finished_at": _now(),
                "input": {"query": "test?"},
                "output": {"result": "wiki snippet"},
            },
        ],
    }

    # POST
    r = httpx.post(f"{BASE}/v1/traces", json=payload)
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["id"] == run_id
    assert body["span_count"] == 4
    print("✓ ingest")

    # Idempotency: re-posting the same run should be fine
    r2 = httpx.post(f"{BASE}/v1/traces", json=payload)
    assert r2.status_code == 201
    print("✓ idempotent ingest")

    # GET /runs
    r = httpx.get(f"{BASE}/v1/runs")
    assert r.status_code == 200
    ids = [row["id"] for row in r.json()]
    assert run_id in ids
    print("✓ list runs")

    # GET /runs/{id}
    r = httpx.get(f"{BASE}/v1/runs/{run_id}")
    assert r.status_code == 200
    detail = r.json()
    assert len(detail["spans"]) == 4
    print("✓ get run detail")

    # Check parent-child structure
    spans_by_id = {s["id"]: s for s in detail["spans"]}
    assert spans_by_id[node_id]["parent_span_id"] == graph_id
    assert spans_by_id[llm_id]["parent_span_id"] == node_id
    assert spans_by_id[tool_id]["parent_span_id"] == node_id
    print("✓ parent-child span tree is correct")

    # GET /runs/{id}/spans
    r = httpx.get(f"{BASE}/v1/runs/{run_id}/spans")
    assert r.status_code == 200
    assert len(r.json()) == 4
    print("✓ list spans")

    # 404 for unknown run
    r = httpx.get(f"{BASE}/v1/runs/{uuid.uuid4()}")
    assert r.status_code == 404
    print("✓ 404 on unknown run")


if __name__ == "__main__":
    print(f"Smoke testing against {BASE}\n")
    test_health()
    test_ingest_and_read()
    print("\n✅ All checks passed.")
