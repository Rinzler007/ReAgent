# ReAgent

**Deterministic replay and diff harness for LangGraph agents.**

The SDK auto-instruments agent runs via a LangGraph callback handler or a manual context-manager API. The replay engine re-executes recorded runs with mocked tool responses to isolate prompt and model regressions from environmental changes. Postgres-backed, self-hosted via Docker.

**Stack:** Python, FastAPI, PostgreSQL, LangGraph, React, Vite

---

## The problem

You change a prompt. Did it break anything ? Existing tools like LangSmith show you traces but won't let you re-execute them deterministically with mocked tool responses. That gap is real.

ReAgent records every run as a trace, then lets you replay any past run with a new prompt or model while serving the original tool responses as fixtures, so you're diffing the LLM's reasoning, not random tool variance.

---

## Quick start

### 1. Start everything

```bash
cd ReAgent
export ANTHROPIC_API_KEY=sk-ant-...   # needed to run agents from the UI
docker compose up -d
```

This starts Postgres on 5432, the FastAPI server on 8000 and the React UI on 5173. Each service waits for the one before it to pass its healthcheck. Open `http://localhost:5173` once the UI container is up (about 30 seconds on first run).

### 2. Install the SDK (to run examples from the terminal)

```bash
python -m venv venv
source venv/bin/activate
pip install -e "reagent_sdk/[langchain]"
pip install -r examples/requirements.txt
```

### 3. Run an agent from the browser

Go to `http://localhost:5173/run`, type any question, pick a model and click Run. The agent executes on the server and you are redirected to the full trace when it finishes.

### 4. Or run the zero-cost demo from the terminal (no API key needed)

```bash
venv/bin/python examples/hello_trace.py
```

Refresh `http://localhost:5173/explorer` and the run appears in the list.

---

## Replaying a run

Record a baseline run, then replay it with a different model. Tool outputs are served from the recording so the diff isolates LLM reasoning from tool variance.

```bash
# Record a baseline (default question: 2008 financial crisis)
venv/bin/python examples/replay_demo.py

# Record with a custom question
venv/bin/python examples/replay_demo.py --question "Your question here"

# Replay against a different model (paste your run ID from the UI or terminal output)
venv/bin/python examples/replay_demo.py --replay <run-id> --model claude-haiku-4-5-20251001
```

After the replay finishes, open the original run in the explorer and click "View diff" in the Replays section.

Or use `ReplayEngine` directly in your own code:

```python
import httpx
from reagent_sdk import Recorder, ReAgentCallbackHandler, ReplayEngine

server_url = "http://localhost:8000"
original_run_id = "..."

spans = httpx.get(f"{server_url}/v1/runs/{original_run_id}/spans").json()
engine = ReplayEngine(spans)

wrapped_tools = engine.wrap_tools(tools)
app = build_graph(new_llm, tools=wrapped_tools)

with recorder.run(metadata={"replay_of": original_run_id}) as new_run:
    handler = ReAgentCallbackHandler(new_run)
    app.invoke(state, config={"callbacks": [handler]})

diff = engine.diff(spans, new_run._all_spans())
httpx.post(
    f"{server_url}/v1/runs/{original_run_id}/replay",
    json={"new_run_id": str(new_run.id), "summary": diff},
)
```

---

## Instrumenting your own agent

### LangGraph (recommended)

Pass `ReAgentCallbackHandler` in the `config` dict. Your node functions stay clean with no tracing boilerplate.

```python
from reagent_sdk import Recorder, ReAgentCallbackHandler

recorder = Recorder(agent_name="my-agent")

with recorder.run(metadata={"model": "claude-haiku-4-5"}) as run:
    handler = ReAgentCallbackHandler(run)
    app.invoke(initial_state, config={"callbacks": [handler]})
```

Graph, node, LLM call and tool call spans are all captured automatically.

### Manual wrapping (any framework)

For non-LangGraph agents or finer-grained control, use the context manager API directly.

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

Traces are shipped automatically when the `with recorder.run()` block exits. Telemetry errors are silenced so your agent code always wins.

---

## Architecture

```
Browser (http://localhost:5173)
  Landing page / Trace explorer / Run agent UI
           |
           | GET /v1/runs, POST /v1/run
           v
reagent Server  (FastAPI, port 8000)
  |                          |
  | runs agent               | stores traces
  v                          v
LangGraph + SDK          PostgreSQL
(tool fixture replay)    (runs / spans / replay_diffs)
```

---

## API

| Method | Path                    | Description                              |
| ------ | ----------------------- | ---------------------------------------- |
| `POST` | `/v1/run`               | Run an agent from the UI, returns run ID |
| `POST` | `/v1/traces`            | Ingest a run and all spans (idempotent)  |
| `GET`  | `/v1/runs`              | List runs (most recent first)            |
| `GET`  | `/v1/runs/{id}`         | Run detail with full span tree           |
| `GET`  | `/v1/runs/{id}/spans`   | Spans for a run                          |
| `POST` | `/v1/runs/{id}/replay`  | Store a replay diff against a run        |
| `GET`  | `/v1/runs/{id}/replays` | List all replay diffs for a run          |

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

`kind` values: `graph`, `node`, `llm_call`, `tool_call`

---

## Cost

LLM API calls only. Use `claude-haiku-4-5` for dev. Everything else (Postgres, FastAPI, React) is free. Set a monthly spend cap on day one.

---

## What's deliberately not built (v1)

- Multi-tenancy and auth
- Real-time streaming UI
- Own eval framework (use promptfoo or DeepEval instead)
- Other frameworks (CrewAI, Claude Agent SDK): v2
- Hosted SaaS: local self-host only

---

## Resume line

> **ReAgent**: Deterministic replay and diff harness for LangGraph agents. SDK auto-instruments agent runs; replay engine re-executes recorded runs with mocked tool responses to isolate prompt and model regressions from environmental changes. Postgres-backed, self-hosted via Docker. Python, FastAPI, React, LangGraph.
