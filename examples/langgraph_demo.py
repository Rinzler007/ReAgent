"""
langgraph_demo.py : LangGraph agent with zero-boilerplate ReAgent tracing.

Spans are recorded automatically via ReAgentCallbackHandler.
No manual run.span() / graph_span.child() needed in node code.

Requires:
    ANTHROPIC_API_KEY=... (or set in .env)
    pip install -e sdk/ langgraph langchain-anthropic python-dotenv

Run:
    python examples/langgraph_demo.py "What caused the 2008 financial crisis?"
"""
from __future__ import annotations

import os
import sys
import operator
from typing import TypedDict, Annotated

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "sdk"))

from dotenv import load_dotenv
load_dotenv()

from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage

from reagent_sdk import Recorder, ReAgentCallbackHandler


# ── State ──────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    question: str
    research: str
    summary: str
    messages: Annotated[list, operator.add]


# ── Nodes (no span plumbing required) ─────────────────────────────────────────

def researcher_node(state: AgentState, llm: ChatAnthropic) -> AgentState:
    prompt = f"Research this question concisely (3-4 bullet points): {state['question']}"
    msg = llm.invoke([HumanMessage(content=prompt)])
    return {**state, "research": msg.content,
            "messages": [HumanMessage(content=prompt), msg]}


def summarizer_node(state: AgentState, llm: ChatAnthropic) -> AgentState:
    prompt = f"Based on this research, write a clear 2-sentence answer:\n\n{state['research']}"
    msg = llm.invoke([HumanMessage(content=prompt)])
    return {**state, "summary": msg.content, "messages": [msg]}


# ── Graph ──────────────────────────────────────────────────────────────────────

def build_graph(llm: ChatAnthropic):
    graph = StateGraph(AgentState)
    graph.add_node("researcher", lambda s: researcher_node(s, llm))
    graph.add_node("summarizer", lambda s: summarizer_node(s, llm))
    graph.set_entry_point("researcher")
    graph.add_edge("researcher", "summarizer")
    graph.add_edge("summarizer", END)
    return graph.compile()


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    question = " ".join(sys.argv[1:]) or "What is LangGraph?"
    model = os.getenv("REAGENT_MODEL", "claude-haiku-4-5-20251001")
    server_url = os.getenv("REAGENT_SERVER_URL", "http://localhost:8000")

    llm = ChatAnthropic(model=model, max_tokens=512)
    recorder = Recorder(agent_name="langgraph-researcher", server_url=server_url)

    print(f"Question: {question}\n")

    with recorder.run(metadata={"model": model, "question": question}) as run:
        handler = ReAgentCallbackHandler(run)
        app = build_graph(llm)
        final_state = app.invoke(
            {"question": question, "messages": []},
            config={"callbacks": [handler]},
        )

    print(f"Answer:\n{final_state['summary']}")
    print(f"\nTrace shipped -> {server_url}/v1/runs")


if __name__ == "__main__":
    main()
