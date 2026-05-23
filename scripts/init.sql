-- ReAgent schema — uses gen_random_uuid() (built-in since Postgres 13, no extension needed)

CREATE TABLE IF NOT EXISTS runs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_run_id UUID NULL REFERENCES runs(id),
    agent_name    TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'running',   -- running | completed | failed
    started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at   TIMESTAMPTZ NULL,
    total_tokens  INT NULL,
    total_cost_usd NUMERIC(12, 6) NULL,
    metadata      JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS spans (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id         UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
    parent_span_id UUID NULL REFERENCES spans(id),
    kind           TEXT NOT NULL,   -- llm_call | tool_call | node | graph
    name           TEXT NOT NULL,
    started_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at    TIMESTAMPTZ NULL,
    input          JSONB NOT NULL DEFAULT '{}',
    output         JSONB NOT NULL DEFAULT '{}',
    error          TEXT NULL
);

CREATE TABLE IF NOT EXISTS replay_diffs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_run_id     UUID NOT NULL REFERENCES runs(id),
    replay_run_id       UUID NOT NULL REFERENCES runs(id),
    divergence_span_id  UUID NULL REFERENCES spans(id),
    summary             JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_spans_run_id      ON spans(run_id);
CREATE INDEX IF NOT EXISTS idx_spans_parent      ON spans(parent_span_id);
CREATE INDEX IF NOT EXISTS idx_runs_parent       ON runs(parent_run_id);
CREATE INDEX IF NOT EXISTS idx_runs_started_at   ON runs(started_at DESC);
