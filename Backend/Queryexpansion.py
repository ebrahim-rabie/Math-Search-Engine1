from nltk.corpus import wordnet
import Preprocessing

_MATH_MAPPINGS = {
    "algebra":   ["linear", "equation", "variable"],
    "calc":      ["calculus", "derivative", "integration", "limit"],
    "geom":      ["geometry", "surface", "area", "shape", "cone", "pyramid"],
    "prob":      ["probability", "statistics", "simulation", "chance"],
    "math":      ["mathematics", "mathematical", "thinking"],
    "eq":        ["equation", "linear"],
    "deriv":     ["derivative", "differentiation"],
    "limit":     ["limits", "calculus"],
    "area":      ["surface", "geometry"],
}

_MATH_OPERATORS = set("+-=/*^<>{}[]()")


def expand_query_wordnet(query: str) -> str:
    terms          = Preprocessing.preprocess_text(query)
    expanded_terms = set(terms)

    for term in terms:
        synsets = wordnet.synsets(term)
        if not synsets:
            continue
        added = 0
        for lemma in synsets[0].lemmas():
            syn = lemma.name().replace("_", " ")
            if syn.lower() != term.lower():
                expanded_terms.add(syn)
                added += 1
                if added >= 2:
                    break

    return " ".join(expanded_terms)


def expand_query_bert(query: str) -> str:
    terms          = Preprocessing.preprocess_text(query)
    expanded_terms = set(terms)

    for term in terms:
        if term in _MATH_MAPPINGS:
            expanded_terms.update(_MATH_MAPPINGS[term])

    return " ".join(expanded_terms)


def pseudo_relevance_feedback(
    query:          str,
    feedback_results: list,
    inverted_index: dict,
    top_k:          int = 2,
) -> str:
    if not feedback_results:
        return query

    top_docs     = {doc_id for doc_id, _ in feedback_results[:top_k]}
    term_freqs:  dict = {}

    for term, postings in inverted_index.items():
        for doc_id in top_docs.intersection(postings.keys()):
            term_freqs[term] = term_freqs.get(term, 0) + postings[doc_id]

    query_terms = set(Preprocessing.preprocess_text(query))

    new_terms = [
        term for term, _ in sorted(term_freqs.items(), key=lambda x: x[1], reverse=True)
        if term not in query_terms
        and not any(c in _MATH_OPERATORS for c in term)
        and not term.isnumeric()
    ][:2]

    return (query + " " + " ".join(new_terms)).strip() if new_terms else query
