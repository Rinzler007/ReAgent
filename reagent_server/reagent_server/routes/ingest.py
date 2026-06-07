"""POST /v1/traces : receive a completed run with all its spans."""
from fastapi import APIRouter, HTTPException
from psycopg.errors import UniqueViolation

from reagent_server.database import db
from reagent_server.models import RunIn, RunOut

router = APIRouter()


@router.post("/v1/traces", response_model=RunOut, status_code=201)
def ingest_trace(run: RunIn):
    with db() as conn:
        # Upsert the run (idempotent on run.id)
        conn.execute(
            """
            INSERT INTO runs (id, parent_run_id, agent_name, status,
                              started_at, finished_at, total_tokens,
                              total_cost_usd, metadata)
            VALUES (%(id)s, %(parent_run_id)s, %(agent_name)s, %(status)s,
                    %(started_at)s, %(finished_at)s, %(total_tokens)s,
                    %(total_cost_usd)s, %(metadata)s)
            ON CONFLICT (id) DO UPDATE
                SET status         = EXCLUDED.status,
                    finished_at    = EXCLUDED.finished_at,
                    total_tokens   = EXCLUDED.total_tokens,
                    total_cost_usd = EXCLUDED.total_cost_usd,
                    metadata       = EXCLUDED.metadata
            """,
            {
                "id": str(run.id),
                "parent_run_id": str(run.parent_run_id) if run.parent_run_id else None,
                "agent_name": run.agent_name,
                "status": run.status,
                "started_at": run.started_at,
                "finished_at": run.finished_at,
                "total_tokens": run.total_tokens,
                "total_cost_usd": run.total_cost_usd,
                "metadata": run.metadata,
            },
        )

        # Insert spans (skip any that already exist)
        for span in run.spans:
            conn.execute(
                """
                INSERT INTO spans (id, run_id, parent_span_id, kind, name,
                                   started_at, finished_at, input, output, error)
                VALUES (%(id)s, %(run_id)s, %(parent_span_id)s, %(kind)s, %(name)s,
                        %(started_at)s, %(finished_at)s, %(input)s, %(output)s, %(error)s)
                ON CONFLICT (id) DO NOTHING
                """,
                {
                    "id": str(span.id),
                    "run_id": str(run.id),
                    "parent_span_id": str(span.parent_span_id) if span.parent_span_id else None,
                    "kind": span.kind,
                    "name": span.name,
                    "started_at": span.started_at,
                    "finished_at": span.finished_at,
                    "input": span.input,
                    "output": span.output,
                    "error": span.error,
                },
            )

    # Return the run we just stored
    with db() as conn:
        row = conn.execute(
            "SELECT *, (SELECT COUNT(*) FROM spans WHERE run_id = runs.id) AS span_count FROM runs WHERE id = %s",
            (str(run.id),),
        ).fetchone()

    return RunOut(**row)
