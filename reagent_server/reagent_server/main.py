"""ReAgent FastAPI application."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from reagent_server.routes import ingest, runs, replay, run

app = FastAPI(
    title="ReAgent",
    description="Agent Trace Replay & Regression Harness",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router)
app.include_router(runs.router)
app.include_router(replay.router)
app.include_router(run.router)


@app.get("/health")
def health():
    return {"status": "ok"}
