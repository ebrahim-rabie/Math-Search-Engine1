"""
main.py — CLI runner for MathSearch.

Usage:
    cd "d:/Projects/DSAI 201/ان شاء الله final"
    python Backend/main.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
import Indexing
import QueryProcessing
import Queryexpansion
import Preprocessing
import Evaluation

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

try:
    df  = pd.read_csv(os.path.join(BASE_DIR, "Documents", "tiny-math-textbooks.csv"))
    df1 = pd.read_csv(os.path.join(BASE_DIR, "Documents", "camel.ai.math.csv"))
except FileNotFoundError as e:
    print(f"[ERROR] Dataset not found: {e}")
    sys.exit(1)

df1 = df1.rename(columns={
    "topic;":    "subject",
    "sub_topic": "chapter",
    "message_1": "lesson",
    "message_2": "response",
})

combined = pd.concat([
    df[["subject", "chapter", "lesson", "response"]].head(1000),
    df1[["subject", "chapter", "lesson", "response"]].head(1000),
], ignore_index=True)
combined["doc_id"] = [f"doc_{i:04d}" for i in range(1, len(combined) + 1)]
combined = combined.dropna(subset=["doc_id", "response"])

math_dict     = dict(zip(combined["doc_id"], combined["response"]))
total_docs    = len(math_dict)
inverted_idx, doc_lengths = Indexing.build_inverted_index(math_dict)

SEP  = "=" * 60
SEP2 = "-" * 60


def _display(results, label="Results"):
    print(f"\n{SEP2}")
    print(f"  {label} — {len(results)} document(s) found")
    print(SEP2)
    if not results:
        print("  (no documents matched)\n")
        return
    for doc_id, score in results[:5]:
        rows = combined[combined["doc_id"] == doc_id]
        if rows.empty:
            continue
        row = rows.iloc[0]
        print(f"  [{doc_id}]  Score: {score:.4f}")
        print(f"  Subject : {row['subject']}")
        print(f"  Chapter : {row['chapter']}")
        print(f"  Snippet : {str(row['response'])[:200].strip()}…")
        print()


def _build_ground_truth(queries: list) -> dict:
    """
    Auto-generate relevance judgments by checking ALL document fields
    (subject, chapter, lesson, response) for the query keywords.
    A document is 'relevant' if any keyword appears in any field.
    """
    ground_truth = {}
    for q in queries:
        keywords = [w.lower() for w in q.split() if len(w) > 2]
        relevant = set()
        for _, row in combined.iterrows():
            haystack = " ".join([
                str(row.get("subject",  "")),
                str(row.get("chapter",  "")),
                str(row.get("lesson",   "")),
                str(row.get("response", ""))[:300],
            ]).lower()
            if any(kw in haystack for kw in keywords):
                relevant.add(row["doc_id"])
        ground_truth[q] = relevant
    return ground_truth


def _run_evaluation(debug: bool = False):
    test_queries = [
        "algebra",
        "linear equation",
        "geometry triangle",
        "calculus derivative",
    ]
    ground_truth = _build_ground_truth(test_queries)

    print(f"\n{SEP}")
    print("  Running Evaluation Suite")
    print(SEP)
    print("  Ground truth sizes:")
    for q, rel in ground_truth.items():
        print(f"    '{q}': {len(rel)} relevant docs")
    print(SEP2)

    if debug:
        for q, rel in ground_truth.items():
            ranked, _ = QueryProcessing.search(q, inverted_idx, total_docs, doc_lengths)
            retrieved = [doc_id for doc_id, _ in ranked[:10]]
            intersection = set(retrieved) & rel
            print(f"  [DEBUG] '{q}'")
            print(f"    Retrieved (top 10) : {retrieved}")
            print(f"    Relevant sample    : {list(rel)[:5]}")
            print(f"    Intersection       : {intersection}")
            print()

    metrics = Evaluation.evaluate_search_engine(
        test_queries, inverted_idx, total_docs, doc_lengths,
        ground_truth=ground_truth,
    )

    for q, m in metrics.items():
        if q == "__MAP__":
            continue
        print(f"  Query : '{q}'")
        print(f"    Speed         : {m['speed_seconds']*1000:.2f} ms")
        print(f"    Retrieved     : {m['retrieved_count']} docs")
        print(f"    Precision     : {m['precision']:.4f}")
        print(f"    Recall        : {m['recall']:.4f}")
        print(f"    F1 Score      : {m['f1']:.4f}")
        print(f"    F-beta (β=2)  : {m['fbeta']:.4f}")
        print(f"    Avg Precision : {m['average_precision']:.4f}")
        print(f"    nDCG          : {m['ndcg']:.4f}")
        print(SEP2)
    if "__MAP__" in metrics:
        print(f"  MAP (Mean Avg Precision): {metrics['__MAP__']:.4f}")
    print()


print(f"\n{SEP}")
print("  MathSearch Engine — Ready")
print(f"  Indexed {total_docs} documents")
print(SEP)
print("  Commands: 'evaluate' | 'quit' | any search query")
print("  Expansion flags are toggled per search.\n")

while True:
    try:
        query = input("Search: ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nExiting.")
        break

    if not query:
        continue

    if query.lower() == "quit":
        print("Goodbye.")
        break

    if query.lower() in ("evaluate", "evaluate debug"):
        _run_evaluation(debug=(query.lower() == "evaluate debug"))
        continue

    use_wordnet  = input("  Enable WordNet expansion?   (y/n) [n]: ").strip().lower() == "y"
    use_bert     = input("  Enable semantic expansion?  (y/n) [n]: ").strip().lower() == "y"
    use_feedback = input("  Enable relevance feedback?  (y/n) [n]: ").strip().lower() == "y"

    print(f"\n  Original query terms : {Preprocessing.preprocess_text(query)}")

    expanded = query
    if use_wordnet:
        expanded = Queryexpansion.expand_query_wordnet(expanded)
        wn_terms = sorted(set(Preprocessing.preprocess_text(expanded)) - set(Preprocessing.preprocess_text(query)))
        print(f"  WordNet added        : {wn_terms if wn_terms else '(none)'}")

    if use_bert:
        expanded_bert = Queryexpansion.expand_query_bert(expanded)
        bert_terms = sorted(set(Preprocessing.preprocess_text(expanded_bert)) - set(Preprocessing.preprocess_text(expanded)))
        print(f"  Semantic added       : {bert_terms if bert_terms else '(none)'}")

    if use_feedback:
        print("  PRF                  : will run 2-pass retrieval")

    ranked, added_terms = QueryProcessing.search(
        query, inverted_idx, total_docs, doc_lengths,
        use_wordnet=use_wordnet,
        use_bert=use_bert,
        use_feedback=use_feedback,
    )

    flags = []
    if use_wordnet:  flags.append("WordNet")
    if use_bert:     flags.append("Semantic")
    if use_feedback: flags.append("PRF (2-pass)")
    label = f"Results — {', '.join(flags) if flags else 'No expansion'}"

    _display(ranked, label)

    if added_terms:
        print(f"  Total expansion terms: {', '.join(added_terms)}\n")
    else:
        print("  No expansion terms were added.\n")
