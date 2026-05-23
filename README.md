# ReAgent

**Deterministic replay & diff harness for LangGraph agents.**

The SDK auto-instruments agent runs via a lightweight context-manager API. The replay engine re-executes recorded runs with mocked tool responses to isolate prompt/model regressions from environmental changes. Postgres-backed, ~5-min self-host via Docker.

**Stack:** Python, FastAPI, PostgreSQL, LangGraph

---

## The problem

You change a prompt. Did it break anything ? Existing tools (LangSmith, Braintrust) show you traces but won't let you re-execute them deterministically with mocked tool responses. That gap is real.

ReAgent records every run as a trace, then lets you **replay** any past run with a new prompt/model while serving the original tool responses as fixtures, so you're diffing the LLM's reasoning, not random tool variance.

---

## Quick start (5 minutes)

### 1. Start the backend

```bash
git clone https://github.com/Rinzler007/ReAgent
cd ReAgent
docker compose up -d
```

### 2. Install the SDK

```bash
pip install -e reagent_sdk/
```

### 3. Run the zero-cost demo (no API key needed)

```bash
python examples/hello_trace.py
```

### 4. See your trace

```bash
curl http://localhost:8000/v1/runs | python -m json.tool
```

---

## Real LangGraph agent

```bash
export ANTHROPIC_API_KEY=sk-ant-...
pip install -r examples/requirements.txt
python examples/langgraph_demo.py "What caused the 2008 financial crisis ?"
```

---

## Instrumenting your own agent

```python
from reagent_sdk import Recorder

recorder = Recorder(agent_name="my-agent")

with recorder.run(metadata={"model": "claude-haiku-4-5"}) as run:
    with run.span("agent_graph", kind="graph") as graph:
        with graph.child("researcher_node", kind="node") as node:
            with node.child("web_search", kind="tool_call",
                            input={"query": "..."}) as tool:
                result = search_web(...)
                tool.set_output({"result": result})
```

Traces are shipped automatically when the `with recorder.run()` block exits. Telemetry errors are silenced, so your agent code always wins.

---

## Architecture

```
Your Agent Code (LangGraph app: unchanged)
       │  context-manager instrumentation
       \/
reagent SDK  (thin Python wrapper)
       │  HTTP POST /v1/traces
       \/
reagent Server  (FastAPI)
       │
       \/
PostgreSQL  (runs / spans / replay_diffs)
```

---

## API

| Method | Path                  | Description                           |
| ------ | --------------------- | ------------------------------------- |
| `POST` | `/v1/traces`          | Ingest a run + all spans (idempotent) |
| `GET`  | `/v1/runs`            | List runs (most recent first)         |
| `GET`  | `/v1/runs/{id}`       | Run detail with full span tree        |
| `GET`  | `/v1/runs/{id}/spans` | Spans for a run                       |

---

## Data model

```sql
runs (id, parent_run_id, agent_name, status, started_at,
      finished_at, total_tokens, total_cost_usd, metadata)

spans (id, run_id, parent_span_id, kind, name,
       started_at, finished_at, input, output, error)

replay_diffs (id, original_run_id, replay_run_id,
              divergence_span_id, summary)
```

`kind` values: `graph` · `node` · `llm_call` · `tool_call`

---

## Cost

LLM API calls only. Use `claude-haiku-4-5` or Groq's free tier for dev. Everything else (Postgres, FastAPI, React) is free. Set a monthly spend cap on day one.

---

## What's deliberately NOT built (v1)

- Multi-tenancy / auth
- Real-time streaming UI
- Own eval framework (link to promptfoo/DeepEval instead)
- Other frameworks (CrewAI, Claude Agent SDK): v2
- Hosted SaaS: local self-host only

---

## Resume line

> **ReAgent**: Deterministic replay & diff harness for LangGraph agents. SDK auto-instruments agent runs; replay engine re-executes recorded runs with mocked tool responses to isolate prompt/model regressions from environmental changes. Postgres-backed, ~5-min self-host via Docker. Python, FastAPI, React, LangGraph.
