"""Database connection — uses psycopg3 (sync) for simplicity in Week 1."""
import os
from contextlib import contextmanager
from typing import Generator

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import JsonbDumper

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://reagent:reagent@localhost:5432/reagent")


def get_connection() -> psycopg.Connection:
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    # Register dict/list → JSONB adapter so %s works for jsonb columns
    conn.adapters.register_dumper(dict, JsonbDumper)
    conn.adapters.register_dumper(list, JsonbDumper)
    return conn


@contextmanager
def db() -> Generator[psycopg.Connection, None, None]:
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
