"""Replay engine for re-running a recorded agent with tool fixtures."""
from __future__ import annotations

from typing import Any


class ReplayEngine:
    """
    Re-runs a recorded agent run using original tool outputs as fixtures,
    isolating LLM changes from tool variance.

    Usage::

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
    """

    def __init__(self, original_spans: list[dict[str, Any]]) -> None:
        self._fixtures: dict[str, list[dict[str, Any]]] = {}
        for span in original_spans:
            if span.get("kind") == "tool_call":
                name = span["name"]
                if name not in self._fixtures:
                    self._fixtures[name] = []
                self._fixtures[name].append(span.get("output", {}))
        self._counters: dict[str, int] = {k: 0 for k in self._fixtures}

    @property
    def fixture_tool_names(self) -> list[str]:
        return list(self._fixtures.keys())

    def wrap_tools(self, tools: list) -> list:
        """Return tools where any tool with a recorded fixture returns that output instead of calling the real function."""
        try:
            from langchain_core.tools import StructuredTool
        except ImportError:
            raise RuntimeError(
                "Install reagent-sdk[langchain] to use wrap_tools."
            )

        wrapped = []
        for tool in tools:
            name = tool.name
            if name in self._fixtures:
                wrapped.append(self._make_fixture_tool(tool, name))
            else:
                wrapped.append(tool)
        return wrapped

    def _make_fixture_tool(self, tool: Any, name: str) -> Any:
        from langchain_core.tools import StructuredTool

        outputs = self._fixtures[name]
        counters = self._counters

        def fixture_func(*args: Any, **kwargs: Any) -> str:
            idx = counters[name] % len(outputs)
            counters[name] += 1
            out = outputs[idx]
            return out.get("output", str(out))

        return StructuredTool(
            name=tool.name,
            description=tool.description,
            func=fixture_func,
            args_schema=getattr(tool, "args_schema", None),
        )

    def diff(
        self,
        original_spans: list[dict[str, Any]],
        new_spans: list,
    ) -> dict[str, Any]:
        """Compare original and new span trees and return a divergence summary."""
        def as_dict(s: Any) -> dict[str, Any]:
            return s if isinstance(s, dict) else s.to_dict()

        orig = [as_dict(s) for s in original_spans]
        new  = [as_dict(s) for s in new_spans]

        orig_llm   = [s for s in orig if s.get("kind") == "llm_call"]
        new_llm    = [s for s in new  if s.get("kind") == "llm_call"]
        orig_tools = [s for s in orig if s.get("kind") == "tool_call"]
        new_tools  = [s for s in new  if s.get("kind") == "tool_call"]

        llm_changes = []
        for i, (o, n) in enumerate(zip(orig_llm, new_llm)):
            o_text = (o.get("output") or {}).get("text", "")
            n_text = (n.get("output") or {}).get("text", "")
            # Skip turns where either side is a structured tool request rather than prose
            def _is_tool_turn(t: Any) -> bool:
                return not t or not isinstance(t, str) or "'type': 'tool_use'" in t
            if _is_tool_turn(o_text) or _is_tool_turn(n_text):
                continue
            if o_text != n_text:
                llm_changes.append({
                    "call_index": i,
                    "span_name": n.get("name"),
                    "original_text": o_text[:500],
                    "new_text": n_text[:500],
                })

        return {
            "original_span_count": len(orig),
            "new_span_count": len(new),
            "original_llm_calls": len(orig_llm),
            "new_llm_calls": len(new_llm),
            "original_tool_calls": len(orig_tools),
            "new_tool_calls": len(new_tools),
            "llm_output_changes": len(llm_changes),
            "changes": llm_changes,
        }
