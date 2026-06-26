// Gemini SDK initialization moved to backend for security.

/**
 * Search the real Python backend (inverted-index + TF-IDF).
 *
 * Returns the full API response object:
 *   { query, expansion, expanded_terms, elapsed_ms, total_found, results: [...] }
 *
 * Throws an error with { offline: true } when the backend is unreachable,
 * so the caller can show a friendly "backend offline" message.
 */
export async function searchBackend(query, { useWordNet = false, useBert = false, useFeedback = false } = {}) {
  const params = new URLSearchParams({
    q:            query,
    use_wordnet:  useWordNet,
    use_bert:     useBert,
    use_feedback: useFeedback,
  });
  const url = `/api/search?${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.detail || `Backend returned ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (err.message === "Failed to fetch") {
      const offline = new Error(
        "Backend is offline. Start the FastAPI server on port 8000."
      );
      offline.offline = true;
      throw offline;
    }
    throw err;
  }
}

// ─── Legacy alias — keeps any old imports working ─────────────────────────────
export const searchMathConcepts = async (query) => {
  const data = await searchBackend(query);
  return data.results ?? [];
};

export async function explainMathConcept(topic, docId = "") {
  try {
    const response = await fetch(`/api/explain?topic=${encodeURIComponent(topic)}&doc_id=${encodeURIComponent(docId)}`);
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      console.error("Gemini API Error details:", data);
      throw new Error(data.detail || data.error || "Explanation failed");
    }
    
    const data = await response.json();
    return data.explanation || "Could not load explanation.";
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error(error.message || "Could not load explanation.");
  }
}
