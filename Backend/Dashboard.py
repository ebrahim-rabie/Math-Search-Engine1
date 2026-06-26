import pandas as pd


def get_dashboard_stats(state: dict) -> dict:
    if not state.get("ready"):
        return {}

    df    = state["df"]
    index = state["index"]

    topic_distribution = [
        {"name": str(k), "value": int(v)}
        for k, v in df["subject"].value_counts().to_dict().items()
    ]

    sorted_terms = sorted(index.items(), key=lambda x: len(x[1]), reverse=True)
    top_terms = [
        {
            "term":      term,
            "frequency": f"{sum(postings.values()):,}",
            "docs":      list(postings.keys())[:5],
        }
        for term, postings in sorted_terms[:6]
    ]

    return {
        "total_docs":         state["total_docs"],
        "vocab_size":         len(index),
        "topic_distribution": topic_distribution,
        "top_terms":          top_terms,
    }
