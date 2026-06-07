"""
hello_trace.py : Zero-cost demo. No API key, no real LLM.

Run:
    cd ReAgent
    pip install -e reagent_sdk/
    python examples/hello_trace.py

You should see "Run shipped!" and a run appear at:
    curl http://localhost:8000/v1/runs | python -m json.tool
"""
import sys
import os

# Allow running without install by adding the sdk to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "reagent_sdk"))

from reagent_sdk import Recorder


class FakeLLM:
    """Stands in for a real LLM so you can test the pipeline for free."""
    def invoke(self, prompt: str) -> str:
        return f"[fake] summary of: {prompt[:60]}..."


def researcher_node(state: dict, llm: FakeLLM) -> dict:
    question = state["question"]
    # Simulate a tool call
    search_result = f"Wikipedia snippet about: {question}"
    return {"research": search_result}


def summarizer_node(state: dict, llm: FakeLLM) -> dict:
    research = state["research"]
    summary = llm.invoke(research)
    return {"summary": summary}


def run_agent(question: str, recorder: Recorder) -> str:
    llm = FakeLLM()
    state = {"question": question}

    with recorder.run(metadata={"model": "fake-llm-v0", "question": question}) as run:
        with run.span("agent_graph", kind="graph") as graph:

            # Node 1: researcher
            with graph.child("researcher_node", kind="node",
                             input={"question": question}) as researcher:
                with researcher.child("web_search", kind="tool_call",
                                     input={"query": question}) as search:
                    result = researcher_node(state, llm)
                    search.set_output({"result": result["research"]})
                researcher.set_output(result)
                state.update(result)

            # Node 2: summarizer
            with graph.child("summarizer_node", kind="node",
                             input={"research": state["research"]}) as summarizer:
                with summarizer.child("call_llm", kind="llm_call",
                                     input={"prompt": state["research"]}) as llm_span:
                    result = summarizer_node(state, llm)
                    llm_span.set_output({"text": result["summary"],
                                        "tokens": 42})  # fake token count
                summarizer.set_output(result)
                state.update(result)

            graph.set_output({"summary": state["summary"]})

    return state["summary"]


if __name__ == "__main__":
    SERVER_URL = os.getenv("REAGENT_SERVER_URL", "http://localhost:8000")
    recorder = Recorder(agent_name="hello-agent", server_url=SERVER_URL)

    question = "What is OpenTelemetry?"
    print(f"Running agent for: {question!r}")
    answer = run_agent(question, recorder)
    print(f"\nAnswer: {answer}")
    print(f"\nRun shipped! Check it at: {SERVER_URL}/v1/runs")
