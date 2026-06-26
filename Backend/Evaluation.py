import time
import numpy as np
import QueryProcessing


def _precision(retrieved: list, relevant: set) -> float:
    if not retrieved:
        return 0.0
    return len(set(retrieved) & relevant) / len(retrieved)


def _recall(retrieved: list, relevant: set) -> float:
    if not relevant:
        return 0.0
    return len(set(retrieved) & relevant) / len(relevant)


def _f1(p: float, r: float) -> float:
    return 2 * p * r / (p + r) if (p + r) > 0 else 0.0


def _fbeta(p: float, r: float, beta: float = 2) -> float:
    b2 = beta ** 2
    return (1 + b2) * (p * r) / ((b2 * p) + r) if (p + r) > 0 else 0.0


def _average_precision(retrieved: list, relevant: set) -> float:
    if not relevant:
        return 0.0
    score, hits = 0.0, 0
    for i, doc in enumerate(retrieved):
        if doc in relevant:
            hits  += 1
            score += hits / (i + 1)
    return score / len(relevant)


def _dcg(retrieved: list, relevant: set) -> float:
    return sum(
        (1 if doc in relevant else 0) / np.log2(i + 2)
        for i, doc in enumerate(retrieved)
    )


def _ndcg(retrieved: list, relevant: set) -> float:
    ideal    = sorted(retrieved, key=lambda x: 1 if x in relevant else 0, reverse=True)
    dcg_val  = _dcg(retrieved, relevant)
    idcg     = _dcg(ideal, relevant)
    return dcg_val / idcg if idcg > 0 else 0.0


def evaluate_search_engine(
    queries:       list,
    inverted_index: dict,
    total_docs:    int,
    doc_lengths:   dict = None,
    ground_truth:  dict = None,
) -> dict:
    metrics:   dict = {}
    ap_scores: list = []

    if doc_lengths is None:
        doc_lengths = {}

    for query in queries:
        t0 = time.time()
        results, _ = QueryProcessing.search(query, inverted_index, total_docs, doc_lengths)
        elapsed = time.time() - t0

        retrieved_docs = [doc_id for doc_id, _ in results]

        p = r = f1 = fb = ap = nd = 0.0

        if ground_truth and query in ground_truth:
            relevant = set(ground_truth[query])
            p  = _precision(retrieved_docs, relevant)
            r  = _recall(retrieved_docs, relevant)
            f1 = _f1(p, r)
            fb = _fbeta(p, r, beta=2)
            ap = _average_precision(retrieved_docs, relevant)
            nd = _ndcg(retrieved_docs, relevant)
            ap_scores.append(ap)

        metrics[query] = {
            "speed_seconds":     elapsed,
            "retrieved_count":   len(retrieved_docs),
            "precision":         round(p,  4),
            "recall":            round(r,  4),
            "f1":                round(f1, 4),
            "fbeta":             round(fb, 4),
            "average_precision": round(ap, 4),
            "ndcg":              round(nd, 4),
        }

    if ap_scores:
        metrics["__MAP__"] = float(np.mean(ap_scores))

    return metrics
