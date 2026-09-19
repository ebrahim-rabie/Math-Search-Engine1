import os
import sys
import json
import time
import logging
import requests
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

# Try loading environment variables from .env files
try:
    from dotenv import load_dotenv
    # Try Backend/.env first
    load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
    # Fallback to Frontend/.env
    load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), "Frontend", ".env"))
except ImportError:
    # Manual fallback if python-dotenv is not installed
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for env_dir in [os.path.dirname(__file__), os.path.join(BASE_DIR, "Frontend")]:
        _env_path = os.path.join(env_dir, ".env")
        if os.path.exists(_env_path):
            with open(_env_path, "r", encoding="utf-8") as _f:
                for _line in _f:
                    _line = _line.strip()
                    if _line and not _line.startswith("#") and "=" in _line:
                        k, v = _line.split("=", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        if k not in os.environ:
                            os.environ[k] = v

import pandas as pd
from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uuid

import Indexing
import QueryProcessing
import Preprocessing
import Evaluation
import Dashboard

logger = logging.getLogger("mathsearch")

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _dataset_path(filename: str, environment_name: str) -> str:
    configured_path = os.getenv(environment_name)
    if configured_path:
        return configured_path

    for directory in ("Documents", "Documents1"):
        path = os.path.join(BASE_DIR, directory, filename)
        if os.path.isfile(path):
            return path

    return os.path.join(BASE_DIR, "Documents", filename)


CSV1_PATH = _dataset_path("tiny-math-textbooks.csv", "CSV1_PATH")
CSV2_PATH = _dataset_path("camel.ai.math.csv", "CSV2_PATH")
MAX_DOCS  = int(os.getenv("MAX_DOCS", "1000"))
TOP_K     = int(os.getenv("TOP_K", "10"))

app = FastAPI(title="MathSearch API", version="1.0.0")

_origins = ["http://localhost:3000", "http://localhost:5173"]
_frontend_url = os.getenv("FRONTEND_URL", "")
if _frontend_url:
    _origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins + ["*"],  # Allow all origins for HF Spaces (same-origin)
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_state: dict = {}

# ── History storage ─────────────────────────────────────────────────────────────
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")


def _load_history() -> list:
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _save_history(history: list):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)


class HistoryEntry(BaseModel):
    query: str
    result: Optional[str] = None
    type: Optional[str] = None
    timestamp: Optional[str] = None


# ── Wolfram cache ───────────────────────────────────────────────────────────────
_wolfram_cache: dict = {}
_CACHE_TTL = 3600  # 1 hour


# ════════════════════════════════════════════════════════════════════════════════
#  Startup
# ════════════════════════════════════════════════════════════════════════════════

@app.on_event("startup")
def startup_event():
    try:
        max_docs = int(os.getenv("MAX_DOCS", 15000))
        df  = pd.read_csv(CSV1_PATH, nrows=max_docs)
        df1 = pd.read_csv(CSV2_PATH, nrows=max_docs)
    except FileNotFoundError as e:
        logger.error("Could not load CSV: %s", e)
        _state["ready"] = False
        return

    df1 = df1.rename(columns={
        "topic;":    "subject",
        "sub_topic": "chapter",
        "message_1": "lesson",
        "message_2": "response",
    })

    df_s1 = df[["subject", "chapter", "lesson", "response"]].head(MAX_DOCS)
    df_s2 = df1[["subject", "chapter", "lesson", "response"]].head(MAX_DOCS)

    combined = pd.concat([df_s1, df_s2], ignore_index=True)
    combined["doc_id"] = [f"doc_{i:04d}" for i in range(1, len(combined) + 1)]
    combined = combined.dropna(subset=["doc_id", "response"])

    math_dict = dict(zip(combined["doc_id"], combined["response"]))

    inverted_idx, doc_lengths = Indexing.build_inverted_index(math_dict)

    _state["df"]          = combined
    _state["math_dict"]   = math_dict
    _state["index"]       = inverted_idx
    _state["doc_lengths"] = doc_lengths
    _state["total_docs"]  = len(math_dict)
    _state["ready"]       = True


def _require_ready():
    if not _state.get("ready"):
        raise HTTPException(
            status_code=503,
            detail="Backend not ready — CSV datasets could not be loaded.",
        )


def _row_to_result(row: pd.Series, score: float, rank: int) -> dict:
    subject = str(row.get("subject", "Mathematics"))
    chapter = str(row.get("chapter", ""))
    lesson  = str(row.get("lesson",  ""))
    text    = str(row.get("response", ""))

    title       = f"{chapter} — {subject}" if chapter else subject
    snippet_raw = (lesson + " " + text).strip()
    snippet     = snippet_raw[:220] + ("…" if len(snippet_raw) > 220 else "")
    tags        = list({subject, chapter} - {""})[:3]

    return {
        "id":        row["doc_id"],
        "score":     f"{score:.4f}",
        "top":       rank == 0,
        "title":     title,
        "topic":     subject,
        "tags":      tags,
        "snippet":   snippet,
        "abstract":  text[:600] + ("…" if len(text) > 600 else ""),
        "full_text": text,
    }


# ════════════════════════════════════════════════════════════════════════════════
#  Core API endpoints (original routes kept for backward compat)
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status":     "ok" if _state.get("ready") else "loading_failed",
        "total_docs": _state.get("total_docs", 0),
    }


@app.get("/search")
@app.get("/api/search")
def search(
    q:            str  = Query(...,   description="Search query"),
    use_wordnet:  bool = Query(False, description="Enable WordNet synonym expansion"),
    use_bert:     bool = Query(False, description="Enable semantic expansion"),
    use_feedback: bool = Query(False, description="Enable pseudo-relevance feedback"),
    top_k:        int  = Query(TOP_K, ge=1, le=50, description="Max results to return"),
):
    _require_ready()

    idx        = _state["index"]
    total_docs = _state["total_docs"]
    df         = _state["df"]

    t0 = time.perf_counter()
    ranked, added_terms = QueryProcessing.search(
        q, idx, total_docs, _state["doc_lengths"],
        use_wordnet=use_wordnet,
        use_bert=use_bert,
        use_feedback=use_feedback,
    )
    elapsed = time.perf_counter() - t0

    results = []
    for rank, (doc_id, score) in enumerate(ranked[:top_k]):
        rows = df[df["doc_id"] == doc_id]
        if rows.empty:
            continue
        results.append(_row_to_result(rows.iloc[0], score, rank))

    return {
        "query":          q,
        "original_terms": Preprocessing.preprocess_text(q),
        "expanded_terms": added_terms,
        "use_wordnet":    use_wordnet,
        "use_bert":       use_bert,
        "use_feedback":   use_feedback,
        "elapsed_ms":     round(elapsed * 1000, 2),
        "total_found":    len(ranked),
        "results":        results,
    }


@app.get("/evaluate")
@app.get("/api/evaluate")
def evaluate():
    _require_ready()

    test_queries = ["algebra", "linear equation", "geometry triangle", "calculus derivative"]
    metrics = Evaluation.evaluate_search_engine(
        test_queries,
        _state["index"],
        _state["total_docs"],
        _state["doc_lengths"],
    )

    queries_data = []
    for q, m in metrics.items():
        if q == "__MAP__":
            continue
        queries_data.append({
            "query":           q,
            "speed_ms":        round(m["speed_seconds"] * 1000, 2),
            "retrieved_count": m["retrieved_count"],
            "precision":       m["precision"],
            "recall":          m["recall"],
            "f1":              m.get("f1", 0.0),
            "fbeta":           m.get("fbeta", 0.0),
            "ap":              m.get("average_precision", 0.0),
            "ndcg":            m.get("ndcg", 0.0),
        })

    return {
        "queries": queries_data,
        "map":     metrics.get("__MAP__", 0.0),
    }


@app.get("/stats")
@app.get("/api/stats")
def stats():
    _require_ready()
    return Dashboard.get_dashboard_stats(_state)


@app.get("/explain")
@app.get("/api/explain")
def explain(
    topic:  str = Query(...,  description="Math topic to explain"),
    doc_id: str = Query(None, description="Document ID for context"),
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured.")

    context = _state.get("math_dict", {}).get(doc_id, f"The topic is: {topic}.")

    prompt = f"""You are a math tutor. Read the following text and explain its core concepts in simple terms for a CS student.

TEXT TO EXPLAIN:
{context[:1500]}

Structure your response EXACTLY like this — no markdown, no asterisks, no bold:

SIMPLE EXPLANATION:
2-3 sentences explaining the concept simply.

INTUITION:
One sentence giving the key intuition.

EXAMPLE:
Show a tiny concrete numerical example. Use plain text math notation.

USED IN:
One line: where this is used in CS or ML.

Keep total response under 120 words. Plain text only."""

    _fallback = (
        f"SIMPLE EXPLANATION:\n{topic} is a fundamental concept in mathematics that helps us understand "
        f"patterns, logic, and structure within complex systems.\n\n"
        f"INTUITION:\nThink of it as a logical tool that translates abstract relationships into concrete, solvable equations.\n\n"
        f"EXAMPLE:\nFor {topic}, we can apply standard computational algorithms. e.g., f(x) -> Solution set.\n\n"
        f"USED IN:\nHeavily utilized in Computer Science for algorithm optimization and Machine Learning architectures."
    )

    try:
        url     = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        res     = requests.post(url, json=payload, timeout=15)
        
        if res.status_code == 429:
            raise HTTPException(
                status_code=429,
                detail="Gemini API quota exceeded (429). Please check your usage limits or verify your API key."
            )
        elif res.status_code in (400, 401, 403):
            detail_msg = "Invalid Gemini API Key or restricted permissions."
            try:
                err_json = res.json()
                detail_msg = err_json.get("error", {}).get("message", detail_msg)
            except Exception:
                pass
            raise HTTPException(status_code=res.status_code, detail=f"Gemini API authentication failed: {detail_msg}")
            
        res.raise_for_status()
        text = res.json()["candidates"][0]["content"]["parts"][0]["text"]
        return {"explanation": text}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.warning("Gemini explain failed: %s", e)
        return {"explanation": _fallback}


# ════════════════════════════════════════════════════════════════════════════════
#  Wolfram Alpha Proxy (moved from Express server.js)
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/wolfram")
@app.get("/api/wolfram")
def wolfram(
    q:    str = Query(..., description="Wolfram query"),
    type: str = Query("short", description="Response type: short, simple, pod, advanced"),
    pod:  str = Query(None,  description="Specific pod"),
):
    app_id = os.getenv("WOLFRAM_APP_ID", "")
    if not app_id:
        return {"result": None, "imageUrl": None}

    # Cache lookup
    cache_key = f"{type}:{q}:{pod or ''}"
    cached = _wolfram_cache.get(cache_key)
    if cached and (time.time() - cached["timestamp"]) < _CACHE_TTL:
        return cached["data"]

    try:
        if type in ("simple", "pod"):
            image_uri = f"https://api.wolframalpha.com/v1/simple?appid={app_id}&i={requests.utils.quote(q)}&background=F8FAFC&fontsize=16"
            result = {"imageUrl": image_uri}

        elif type == "advanced":
            url = f"https://api.wolframalpha.com/v1/query?appid={app_id}&input={requests.utils.quote(q)}&output=json"
            res = requests.get(url, timeout=8)
            if not res.ok:
                raise Exception(f"Wolfram Error {res.status_code}")
            result = res.json()

        else:
            # Default: short answer API
            url = f"https://api.wolframalpha.com/v1/result?appid={app_id}&i={requests.utils.quote(q)}"
            res = requests.get(url, timeout=8)

            if res.status_code == 501:
                # Fallback to Full Results API
                fallback_url = f"https://api.wolframalpha.com/v1/query?appid={app_id}&input={requests.utils.quote(q)}&output=json"
                fallback_res = requests.get(fallback_url, timeout=8)
                if fallback_res.ok:
                    data = fallback_res.json()
                    pods = data.get("queryresult", {}).get("pods", [])
                    target_pod = None
                    for p in pods:
                        if p.get("primary") or p.get("title") in ["Result", "Solution", "Roots", "Derivative", "Integral", "Limit", "Exact result"]:
                            target_pod = p
                            break
                    if target_pod and target_pod.get("subpods"):
                        text_parts = [sp.get("plaintext", "") for sp in target_pod["subpods"] if sp.get("plaintext")]
                        if text_parts:
                            result = {"result": " | ".join(text_parts)}
                            _wolfram_cache[cache_key] = {"data": result, "timestamp": time.time()}
                            return result
                result = {"result": None}
                _wolfram_cache[cache_key] = {"data": result, "timestamp": time.time()}
                return result

            if not res.ok:
                raise Exception(f"Wolfram Error {res.status_code}")

            result = {"result": res.text}

        # Save to cache
        _wolfram_cache[cache_key] = {"data": result, "timestamp": time.time()}

        # Cleanup old cache entries
        if len(_wolfram_cache) > 1000:
            oldest_key = next(iter(_wolfram_cache))
            _wolfram_cache.pop(oldest_key, None)

        return result

    except Exception as e:
        logger.warning("Wolfram query failed: %s", e)
        return {"result": None, "imageUrl": None}


# ════════════════════════════════════════════════════════════════════════════════
#  History API (moved from Express server.js)
# ════════════════════════════════════════════════════════════════════════════════

@app.get("/api/history")
def get_history():
    return JSONResponse(content=_load_history())


@app.post("/api/history")
def save_history(entry: HistoryEntry):
    history = _load_history()
    new_entry = {
        "id": uuid.uuid4().hex[:9],
        "query": entry.query,
        "result": entry.result,
        "type": entry.type,
        "timestamp": entry.timestamp or datetime.now().isoformat(),
    }
    history = [new_entry] + history
    history = history[:100]  # Keep last 100
    _save_history(history)
    return JSONResponse(content=new_entry)


# ════════════════════════════════════════════════════════════════════════════════
#  Static file serving for React frontend (production)
# ════════════════════════════════════════════════════════════════════════════════

# Serve React dist — must be LAST so API routes take priority
_dist_dir = os.path.join(BASE_DIR, "Frontend", "dist")
if os.path.isdir(_dist_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(_dist_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        """Serve static files or fall back to index.html for SPA routing."""
        file_path = os.path.join(_dist_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(_dist_dir, "index.html"))
