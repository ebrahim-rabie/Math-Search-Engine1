import math
import Preprocessing
import Queryexpansion


def _compute_tf(term_freq: int, doc_length: int) -> float:
    if doc_length == 0:
        return 0.0
    return term_freq / doc_length


def _compute_idf(term: str, inverted_index: dict, total_docs: int) -> float:
    df = len(inverted_index.get(term, {}))
    return math.log((total_docs + 1) / (df + 1)) + 1


def process_query(query: str, inverted_index: dict, total_docs: int, doc_lengths: dict) -> list:
    query_terms = Preprocessing.preprocess_text(query)

    if not query_terms:
        return []

    candidate_docs = set(inverted_index.get(query_terms[0], {}).keys())
    for term in query_terms[1:]:
        candidate_docs |= set(inverted_index.get(term, {}).keys())

    if not candidate_docs:
        return []

    scores: dict = {}
    for doc_id in candidate_docs:
        doc_length = doc_lengths.get(doc_id, 1)
        scores[doc_id] = sum(
            _compute_tf(inverted_index.get(t, {}).get(doc_id, 0), doc_length)
            * _compute_idf(t, inverted_index, total_docs)
            for t in query_terms
        )

    max_score = max(scores.values(), default=0)
    if max_score > 0:
        scores = {d: s / max_score for d, s in scores.items()}

    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


def search(
    query:            str,
    inverted_index:   dict,
    total_docs:       int,
    doc_lengths:      dict,
    use_wordnet:      bool = False,
    use_bert:         bool = False,
    use_feedback:     bool = False,
    feedback_results: list = None,
) -> tuple:
    """
    Two-pass retrieval with optional query expansion and pseudo-relevance feedback.

    Pass 1: Retrieve with original (+ optionally WordNet/BERT-expanded) query.
    Pass 2: If PRF enabled, inject top-doc terms and re-retrieve.

    Returns (ranked_list, added_terms)
    """
    original_terms  = set(Preprocessing.preprocess_text(query))
    effective_query = query

    if use_wordnet:
        effective_query = Queryexpansion.expand_query_wordnet(effective_query)

    if use_bert:
        effective_query = Queryexpansion.expand_query_bert(effective_query)

    first_pass = process_query(effective_query, inverted_index, total_docs, doc_lengths)

    if use_feedback and first_pass:
        prf_query = Queryexpansion.pseudo_relevance_feedback(
            effective_query, first_pass, inverted_index
        )
        if prf_query != effective_query:
            effective_query = prf_query
            ranked = process_query(effective_query, inverted_index, total_docs, doc_lengths)
        else:
            ranked = first_pass
    else:
        ranked = first_pass

    added_terms = sorted(set(Preprocessing.preprocess_text(effective_query)) - original_terms)

    return ranked, added_terms
