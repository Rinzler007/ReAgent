"""
langgraph_demo.py — Real LangGraph agent instrumented with ReAgent SDK.

Requires:
    ANTHROPIC_API_KEY=... (or set in .env)
    pip install -e reagent_sdk/ langgraph langchain-anthropic

Run:
    python examples/langgraph_demo.py "What caused the 2008 financial crisis?"
"""
from __future__ import annotations

import os
import sys
from typing import TypedDict, Annotated
import operator

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "reagent_sdk"))

from dotenv import load_dotenv
load_dotenv()

from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, AIMessage

from reagent_sdk import Recorder


# ── State ─────────────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    question: str
    research: str
    summary: str
    messages: Annotated[list, operator.add]


# ── Nodes ─────────────────────────────────────────────────────────────────────

def researcher_node(state: AgentState, llm: ChatAnthropic, graph_span) -> AgentState:
    """Generates a research outline — stands in for a real web-search tool."""
    with graph_span.child("researcher_node", kind="node",
                          input={"question": state["question"]}) as node_span:
        prompt = f"Research this question concisely (3-4 bullet points): {state['question']}"
        with node_span.child("call_llm", kind="llm_call",
                             input={"model": "claude-haiku-4-5", "prompt": prompt}) as llm_span:
            msg = llm.invoke([HumanMessage(content=prompt)])
            research = msg.content
            llm_span.set_output({"text": research,
                                 "usage": getattr(msg, "usage_metadata", {})})
        node_span.set_output({"research": research})

    return {**state, "research": research,
            "messages": [HumanMessage(content=prompt), msg]}


def summarizer_node(state: AgentState, llm: ChatAnthropic, graph_span) -> AgentState:
    """Turns raw research into a polished answer."""
    with graph_span.child("summarizer_node", kind="node",
                          input={"research": state["research"]}) as node_span:
        prompt = f"Based on this research, write a clear 2-sentence answer:\n\n{state['research']}"
        with node_span.child("call_llm", kind="llm_call",
                             input={"model": "claude-haiku-4-5", "prompt": prompt}) as llm_span:
            msg = llm.invoke([HumanMessage(content=prompt)])
            summary = msg.content
            llm_span.set_output({"text": summary,
                                 "usage": getattr(msg, "usage_metadata", {})})
        node_span.set_output({"summary": summary})

    return {**state, "summary": summary, "messages": [msg]}


# ── Graph ──────────────────────────────────────────────────────────────────────

def build_graph(llm: ChatAnthropic, graph_span):
    graph = StateGraph(AgentState)

    graph.add_node("researcher", lambda s: researcher_node(s, llm, graph_span))
    graph.add_node("summarizer", lambda s: summarizer_node(s, llm, graph_span))

    graph.set_entry_point("researcher")
    graph.add_edge("researcher", "summarizer")
    graph.add_edge("summarizer", END)

    return graph.compile()


def main():
    question = " ".join(sys.argv[1:]) or "What is LangGraph?"
    model = os.getenv("REAGENT_MODEL", "claude-haiku-4-5-20251001")
    server_url = os.getenv("REAGENT_SERVER_URL", "http://localhost:8000")

    llm = ChatAnthropic(model=model, max_tokens=512)
    recorder = Recorder(agent_name="langgraph-researcher", server_url=server_url)

    print(f"Question: {question}\n")

    with recorder.run(metadata={"model": model, "question": question}) as run:
        with run.span("agent_graph", kind="graph",
                      input={"question": question}) as graph_span:
            app = build_graph(llm, graph_span)
            final_state = app.invoke({"question": question, "messages": []})
            graph_span.set_output({"summary": final_state["summary"]})

    print(f"Answer:\n{final_state['summary']}")
    print(f"\nTrace shipped -> {server_url}/v1/runs")


if __name__ == "__main__":
    main()
