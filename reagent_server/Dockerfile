FROM python:3.12-slim

WORKDIR /app

COPY reagent_sdk /reagent_sdk
RUN pip install --no-cache-dir -e "/reagent_sdk[langchain]"

COPY reagent_server/pyproject.toml .
RUN pip install --no-cache-dir -e ".[dev]"

COPY reagent_server/reagent_server/ reagent_server/

CMD ["uvicorn", "reagent_server.main:app", "--host", "0.0.0.0", "--port", "8000"]
