import asyncio
import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from reagent_sdk import Recorder, ReAgentCallbackHandler
from reagent_server.agent import build_agent

router = APIRouter()

SUPPORTED_MODELS = {
    "claude-haiku-4-5-20251001",
    "claude-sonnet-4-6",
}


class RunRequest(BaseModel):
    question: str
    model: str = "claude-haiku-4-5-20251001"


class RunResponse(BaseModel):
    run_id: str


@router.post("/v1/run", response_model=RunResponse)
async def trigger_run(req: RunRequest):
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=503, detail="ANTHROPIC_API_KEY is not set on the server.")

    if req.model not in SUPPORTED_MODELS:
        raise HTTPException(status_code=400, detail=f"Unsupported model: {req.model}")

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    def _run() -> str:
        recorder = Recorder(agent_name="reagent-ui", server_url="http://localhost:8000")
        app = build_agent(req.model)
        with recorder.run(metadata={"model": req.model, "question": req.question}) as run:
            handler = ReAgentCallbackHandler(run)
            app.invoke(
                {"messages": [{"role": "user", "content": req.question}]},
                config={"callbacks": [handler]},
            )
        return str(run.id)

    try:
        loop = asyncio.get_event_loop()
        run_id = await loop.run_in_executor(None, _run)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return RunResponse(run_id=run_id)
