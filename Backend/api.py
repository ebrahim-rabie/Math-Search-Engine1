import os
import sys
import time
import logging
import requests

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
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import Indexing
import QueryProcessing
import Preprocessing
import Evaluation
import Dashboard

logger = logging.getLogger("mathsearch")

BASE_DIR  = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV1_PATH = os.getenv("CSV1_PATH", os.path.join(BASE_DIR, "Documents", "tiny-math-textbooks.csv"))
CSV2_PATH = os.getenv("CSV2_PATH", os.path.join(BASE_DIR, "Documents", "camel.ai.math.csv"))
MAX_DOCS  = int(os.getenv("MAX_DOCS", "1000"))
TOP_K     = int(os.getenv("TOP_K", "10"))

app = FastAPI(title="MathSearch API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

_state: dict = {}


@app.on_event("startup")
def startup_event():
    try:
        df  = pd.read_csv(CSV1_PATH)
        df1 = pd.read_csv(CSV2_PATH)
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


@app.get("/health")
def health():
    return {
        "status":     "ok" if _state.get("ready") else "loading_failed",
        "total_docs": _state.get("total_docs", 0),
    }


@app.get("/search")
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
def stats():
    _require_ready()
    return Dashboard.get_dashboard_stats(_state)


@app.get("/explain")
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


@app.get("/wolfram")
def wolfram(
    q:    str = Query(..., description="Wolfram query"),
    type: str = Query("short", description="Response type"),
    pod:  str = Query(None,  description="Specific pod"),
):
    _require_ready()
    app_id = os.getenv("WOLFRAM_APP_ID", "")
    if not app_id:
        return {"result": None, "imageUrl": None}

    try:
        if type == "short":
            url  = f"https://api.wolframalpha.com/v1/result?appid={app_id}&i={requests.utils.quote(q)}"
            res  = requests.get(url, timeout=8)
            return {"result": res.text if res.ok else None}
        elif type == "simple":
            url  = f"https://api.wolframalpha.com/v1/simple?appid={app_id}&i={requests.utils.quote(q)}"
            res  = requests.get(url, timeout=8)
            return {"imageUrl": f"data:image/gif;base64,{res.content.decode('latin-1')}" if res.ok else None}
    except Exception as e:
        logger.warning("Wolfram query failed: %s", e)
        return {"result": None, "imageUrl": None}
