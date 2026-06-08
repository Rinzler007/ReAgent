"""LangGraph/LangChain callback handler for automatic ReAgent span recording."""
from __future__ import annotations

import traceback
from typing import Any, Dict, List, Optional
from uuid import UUID

from langchain_core.callbacks import BaseCallbackHandler
from langchain_core.messages import BaseMessage
from langchain_core.outputs import LLMResult

from reagent_sdk.recorder import Run, Span


def _sanitize(obj: Any) -> Any:
    """Recursively make a value JSON-safe, converting LangChain messages and other non-serializable objects to plain dicts/strings."""
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_sanitize(v) for v in obj]
    if isinstance(obj, BaseMessage):
        return {"type": type(obj).__name__, "content": obj.content}
    return str(obj)


def _extract_name(serialized: Dict[str, Any] | None, kwargs: dict) -> str:
    s = serialized or {}
    return (
        kwargs.get("name")
        or kwargs.get("run_name")
        or s.get("name")
        or (s.get("id") or ["unknown"])[-1]
        or "unknown"
    )


def _msg_content(m: BaseMessage) -> str:
    return getattr(m, "content", str(m))


class ReAgentCallbackHandler(BaseCallbackHandler):
    """
    Auto-instrument any LangGraph/LangChain invocation.

    Usage::

        with recorder.run() as run:
            handler = ReAgentCallbackHandler(run)
            app.invoke(state, config={"callbacks": [handler]})
    """

    raise_error = False  # telemetry never crashes the caller

    def __init__(self, run: Run) -> None:
        super().__init__()
        self._run = run
        self._spans: dict[UUID, Span] = {}

    def _start(
        self,
        run_id: UUID,
        name: str,
        kind: str,
        input: dict[str, Any],
        parent_run_id: UUID | None,
    ) -> None:
        try:
            parent = self._spans.get(parent_run_id) if parent_run_id else None
            safe_input = _sanitize(input)
            span = (
                parent.start_child(name=name, kind=kind, input=safe_input)
                if parent is not None
                else self._run.start_span(name=name, kind=kind, input=safe_input)
            )
            self._spans[run_id] = span
        except Exception:
            pass

    def _end(
        self,
        run_id: UUID,
        output: dict[str, Any] | None = None,
        error: str | None = None,
    ) -> None:
        try:
            span = self._spans.pop(run_id, None)
            if span is not None:
                span.finish(output=_sanitize(output), error=error)
        except Exception:
            pass

    # ── Chain (graph + nodes) ─────────────────────────────────────────────────

    def on_chain_start(
        self,
        serialized: Dict[str, Any],
        inputs: Dict[str, Any],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> None:
        name = _extract_name(serialized, kwargs)
        kind = "node" if parent_run_id and parent_run_id in self._spans else "graph"
        self._start(run_id, name=name, kind=kind, input=inputs or {},
                    parent_run_id=parent_run_id)

    def on_chain_end(
        self,
        outputs: Dict[str, Any],
        *,
        run_id: UUID,
        **kwargs: Any,
    ) -> None:
        out = outputs if isinstance(outputs, dict) else {"output": str(outputs)}
        self._end(run_id, output=out)

    def on_chain_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        **kwargs: Any,
    ) -> None:
        self._end(run_id, error=traceback.format_exc())

    # ── Chat model (ChatAnthropic, ChatOpenAI, etc.) ──────────────────────────

    def on_chat_model_start(
        self,
        serialized: Dict[str, Any],
        messages: List[List[BaseMessage]],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> None:
        name = _extract_name(serialized, kwargs)
        msg_input = {"messages": [[_msg_content(m) for m in batch] for batch in messages]}
        self._start(run_id, name=name, kind="llm_call", input=msg_input,
                    parent_run_id=parent_run_id)

    # ── LLM (completions API) ─────────────────────────────────────────────────

    def on_llm_start(
        self,
        serialized: Dict[str, Any],
        prompts: List[str],
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> None:
        name = _extract_name(serialized, kwargs)
        self._start(run_id, name=name, kind="llm_call", input={"prompts": prompts},
                    parent_run_id=parent_run_id)

    def on_llm_end(
        self,
        response: LLMResult,
        *,
        run_id: UUID,
        **kwargs: Any,
    ) -> None:
        try:
            text = ""
            for batch in response.generations:
                for g in batch:
                    text = getattr(g, "text", None) or getattr(
                        getattr(g, "message", None), "content", ""
                    )
                    break
                break
            output: dict[str, Any] = {"text": text}
            if response.llm_output:
                output["usage"] = response.llm_output
        except Exception:
            output = {}
        self._end(run_id, output=output)

    def on_llm_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        **kwargs: Any,
    ) -> None:
        self._end(run_id, error=traceback.format_exc())

    # ── Tool ──────────────────────────────────────────────────────────────────

    def on_tool_start(
        self,
        serialized: Dict[str, Any],
        input_str: str,
        *,
        run_id: UUID,
        parent_run_id: Optional[UUID] = None,
        **kwargs: Any,
    ) -> None:
        name = _extract_name(serialized, kwargs)
        self._start(run_id, name=name, kind="tool_call", input={"input": input_str},
                    parent_run_id=parent_run_id)

    def on_tool_end(
        self,
        output: str,
        *,
        run_id: UUID,
        **kwargs: Any,
    ) -> None:
        out = {"output": output} if isinstance(output, str) else (output or {})
        self._end(run_id, output=out)

    def on_tool_error(
        self,
        error: BaseException,
        *,
        run_id: UUID,
        **kwargs: Any,
    ) -> None:
        self._end(run_id, error=traceback.format_exc())
