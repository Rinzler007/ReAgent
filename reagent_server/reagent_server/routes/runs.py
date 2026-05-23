"""GET endpoints for reading runs and spans."""
from uuid import UUID

from fastapi import APIRouter, HTTPException

from reagent_server.database import db
from reagent_server.models import RunDetail, RunOut, SpanOut

router = APIRouter()


@router.get("/v1/runs", response_model=list[RunOut])
def list_runs(limit: int = 50, offset: int = 0):
    with db() as conn:
        rows = conn.execute(
            """
            SELECT r.*,
                   (SELECT COUNT(*) FROM spans s WHERE s.run_id = r.id) AS span_count
            FROM runs r
            ORDER BY r.started_at DESC
            LIMIT %s OFFSET %s
            """,
            (limit, offset),
        ).fetchall()
    return [RunOut(**r) for r in rows]


@router.get("/v1/runs/{run_id}", response_model=RunDetail)
def get_run(run_id: UUID):
    with db() as conn:
        run_row = conn.execute(
            """
            SELECT r.*,
                   (SELECT COUNT(*) FROM spans s WHERE s.run_id = r.id) AS span_count
            FROM runs r WHERE r.id = %s
            """,
            (str(run_id),),
        ).fetchone()

        if not run_row:
            raise HTTPException(status_code=404, detail="Run not found")

        span_rows = conn.execute(
            "SELECT * FROM spans WHERE run_id = %s ORDER BY started_at",
            (str(run_id),),
        ).fetchall()

    spans = [SpanOut(**s) for s in span_rows]
    return RunDetail(**run_row, spans=spans)


@router.get("/v1/runs/{run_id}/spans", response_model=list[SpanOut])
def list_spans(run_id: UUID):
    with db() as conn:
        exists = conn.execute("SELECT 1 FROM runs WHERE id = %s", (str(run_id),)).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="Run not found")

        rows = conn.execute(
            "SELECT * FROM spans WHERE run_id = %s ORDER BY started_at",
            (str(run_id),),
        ).fetchall()

    return [SpanOut(**r) for r in rows]
