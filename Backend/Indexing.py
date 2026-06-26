import Preprocessing


def build_inverted_index(documents: dict) -> tuple:
    inverted_index: dict = {}
    doc_lengths:    dict = {}

    for doc_id, text in documents.items():
        tokens = Preprocessing.preprocess_text(text)

        for token in tokens:
            if token not in inverted_index:
                inverted_index[token] = {}
            inverted_index[token][doc_id] = inverted_index[token].get(doc_id, 0) + 1

        doc_lengths[doc_id] = len(tokens)

    return inverted_index, doc_lengths
