"""Replay diff endpoints for storing and retrieving run comparisons."""
from uuid import UUID

from fastapi import APIRouter, HTTPException

from reagent_server.database import db
from reagent_server.models import ReplayDiffOut, ReplayIn

router = APIRouter()


@router.post("/v1/runs/{run_id}/replay", response_model=ReplayDiffOut, status_code=201)
def store_replay(run_id: UUID, body: ReplayIn):
    with db() as conn:
        if not conn.execute(
            "SELECT 1 FROM runs WHERE id = %s", (str(run_id),)
        ).fetchone():
            raise HTTPException(status_code=404, detail="Original run not found")

        if not conn.execute(
            "SELECT 1 FROM runs WHERE id = %s", (str(body.new_run_id),)
        ).fetchone():
            raise HTTPException(status_code=404, detail="Replay run not found")

        row = conn.execute(
            """
            INSERT INTO replay_diffs (original_run_id, replay_run_id, summary)
            VALUES (%s, %s, %s)
            RETURNING *
            """,
            (str(run_id), str(body.new_run_id), body.summary),
        ).fetchone()

    return ReplayDiffOut(**row)


@router.get("/v1/runs/{run_id}/replays", response_model=list[ReplayDiffOut])
def list_replays(run_id: UUID):
    with db() as conn:
        if not conn.execute(
            "SELECT 1 FROM runs WHERE id = %s", (str(run_id),)
        ).fetchone():
            raise HTTPException(status_code=404, detail="Run not found")

        rows = conn.execute(
            "SELECT * FROM replay_diffs WHERE original_run_id = %s ORDER BY created_at DESC",
            (str(run_id),),
        ).fetchall()

    return [ReplayDiffOut(**r) for r in rows]
