"""
replay_demo.py : Record a LangGraph tool-calling agent, then replay it with a
different model. Tool outputs are served from the original recording so the
comparison isolates LLM reasoning from tool variance.

Requires:
    ANTHROPIC_API_KEY in .env
    pip install -e "reagent_sdk/[langchain]" langgraph langchain-anthropic python-dotenv

First run (record):
    venv/bin/python examples/replay_demo.py

Replay with a different model:
    venv/bin/python examples/replay_demo.py --replay <run-id> --model claude-haiku-4-5-20251001
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "reagent_sdk"))

from dotenv import load_dotenv
load_dotenv()

import httpx
from langchain_anthropic import ChatAnthropic
from langchain_core.tools import tool
from langgraph.prebuilt import create_react_agent

from reagent_sdk import Recorder, ReAgentCallbackHandler, ReplayEngine


# ── Tool definition ────────────────────────────────────────────────────────────

@tool
def web_search(query: str) -> str:
    """Search the web for current information about any topic."""
    try:
        from duckduckgo_search import DDGS
        results = list(DDGS().text(query, max_results=4))
        if not results:
            return f"No results found for: {query}"
        return "\n\n".join(
            f"[{r['title']}]\n{r['body']}"
            for r in results
        )
    except Exception as e:
        return f"Search failed: {e}"


# ── Graph builder ──────────────────────────────────────────────────────────────

def build_graph(llm: ChatAnthropic, tools: list):
    return create_react_agent(llm, tools)


# ── Record mode ────────────────────────────────────────────────────────────────

def record(question: str, model: str, server_url: str) -> str:
    llm = ChatAnthropic(model=model, max_tokens=1024)
    tools = [web_search]
    app = build_graph(llm, tools)
    recorder = Recorder(agent_name="replay-demo", server_url=server_url)

    print(f"Recording run with model: {model}\n")
    with recorder.run(metadata={"model": model, "question": question}) as run:
        handler = ReAgentCallbackHandler(run)
        result = app.invoke(
            {"messages": [{"role": "user", "content": question}]},
            config={"callbacks": [handler]},
        )

    answer = result["messages"][-1].content
    run_id = str(run.id)
    print(f"Answer:\n{answer}\n")
    print(f"Run ID: {run_id}")
    print(f"Trace at: {server_url}/v1/runs/{run_id}")
    return run_id


# ── Replay mode ────────────────────────────────────────────────────────────────

def replay(original_run_id: str, new_model: str, server_url: str) -> None:
    print(f"Fetching original spans for run: {original_run_id}")
    spans = httpx.get(f"{server_url}/v1/runs/{original_run_id}/spans").json()
    original_run = httpx.get(f"{server_url}/v1/runs/{original_run_id}").json()
    question = original_run.get("metadata", {}).get("question", "What caused the 2008 financial crisis?")
    original_model = original_run.get("metadata", {}).get("model", "unknown")

    engine = ReplayEngine(spans)
    print(f"Fixtures loaded for tools: {engine.fixture_tool_names or ['none']}")

    llm = ChatAnthropic(model=new_model, max_tokens=1024)
    wrapped_tools = engine.wrap_tools([web_search])
    app = build_graph(llm, wrapped_tools)

    recorder = Recorder(agent_name="replay-demo", server_url=server_url)
    print(f"\nReplaying with model: {new_model}\n")

    with recorder.run(metadata={
        "model": new_model,
        "question": question,
        "replay_of": original_run_id,
    }) as new_run:
        handler = ReAgentCallbackHandler(new_run)
        result = app.invoke(
            {"messages": [{"role": "user", "content": question}]},
            config={"callbacks": [handler]},
        )

    answer = result["messages"][-1].content
    print(f"Answer:\n{answer}\n")

    diff = engine.diff(spans, new_run._all_spans())

    httpx.post(
        f"{server_url}/v1/runs/{original_run_id}/replay",
        json={"new_run_id": str(new_run.id), "summary": diff},
    )

    print("Divergence summary:")
    print(f"  LLM calls:  {diff['original_llm_calls']} original vs {diff['new_llm_calls']} new")
    print(f"  Tool calls: {diff['original_tool_calls']} original vs {diff['new_tool_calls']} new")
    print(f"  LLM outputs changed: {diff['llm_output_changes']}")
    if diff["changes"]:
        print("\nChanged LLM outputs:")
        for change in diff["changes"]:
            print(f"\n  Call {change['call_index']} ({change['span_name']}):")
            print(f"  [{original_model}] {change['original_text'][:200]}")
            print(f"  [{new_model}] {change['new_text'][:200]}")


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="ReAgent replay demo")
    parser.add_argument("--replay",  metavar="RUN_ID", help="Run ID to replay")
    parser.add_argument("--model",   default=os.getenv("REAGENT_MODEL", "claude-haiku-4-5-20251001"))
    parser.add_argument("--server",  default=os.getenv("REAGENT_SERVER_URL", "http://localhost:8000"))
    parser.add_argument("--question", default="What caused the 2008 financial crisis?")
    args = parser.parse_args()

    if args.replay:
        replay(args.replay, args.model, args.server)
    else:
        record(args.question, args.model, args.server)


if __name__ == "__main__":
    main()
