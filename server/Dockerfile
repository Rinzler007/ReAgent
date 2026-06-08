FROM python:3.12-slim

WORKDIR /app

COPY sdk /sdk
RUN pip install --no-cache-dir -e "/sdk[langchain]"

COPY server/pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

COPY server/reagent_server/ reagent_server/

CMD ["uvicorn", "reagent_server.main:app", "--host", "0.0.0.0", "--port", "8000"]
