import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search as SearchIcon, LayoutDashboard, Zap, ArrowRight,
  Sun, Moon, HelpCircle, X, ChevronDown, Sparkles, ToggleLeft, ToggleRight
} from 'lucide-react';
import { ResultCard } from '../components/results/ResultCard';

// ── Related term suggestions per topic keyword ──────────────────────────────
const RELATED_SUGGESTIONS = {
  calc:     ['calculus', 'derivative', 'integration', 'limit'],
  alg:      ['algebra', 'linear equation', 'polynomial'],
  geom:     ['geometry', 'triangle', 'surface area', 'cone'],
  prob:     ['probability', 'statistics', 'simulation'],
  math:     ['algebra', 'calculus', 'geometry'],
  deriv:    ['derivative', 'chain rule', 'differentiation'],
  trig:     ['sine', 'cosine', 'trigonometry'],
  eq:       ['equation', 'linear', 'solve for x'],
  area:     ['surface area', 'geometry', 'pyramid'],
  limit:    ['limits', 'calculus', 'continuity'],
};

function getRelatedSuggestions(query) {
  const q = query.toLowerCase().trim();
  for (const [key, vals] of Object.entries(RELATED_SUGGESTIONS)) {
    if (q === key || q.startsWith(key)) return vals;
  }
  if (q.split(/\s+/).length <= 1) {
    return ['algebra', 'calculus', 'geometry', 'probability'];
  }
  return [];
}

// ── "Why these results?" explanation content ────────────────────────────────
function WhyModal({ onClose, useWordNet, useBert, useFeedback, expandedTerms }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
      >
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-white" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">How Results Are Found</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <StepCard
            number="1"
            color="blue"
            title="Query Preprocessing"
            desc="Your query is tokenized, lowercased, and lemmatized. Stop words are removed. Mathematical symbols are preserved."
            active={true}
          />
          <StepCard
            number="2"
            color="violet"
            title="WordNet Synonym Expansion"
            desc="Synonyms from WordNet's linguistic database are added to widen the vocabulary. Limited to the most common meaning to prevent topic drift."
            active={useWordNet}
          />
          <StepCard
            number="3"
            color="emerald"
            title="Semantic Expansion (BERT-Proxy)"
            desc="Domain-specific mathematical mappings are applied — e.g. 'calc' expands to 'calculus, derivative, integration, limit'."
            active={useBert}
          />
          <StepCard
            number="4"
            color="amber"
            title="Pseudo-Relevance Feedback"
            desc="Top documents from an initial retrieval pass are analysed and their most frequent meaningful terms are injected back into the query (Rocchio algorithm)."
            active={useFeedback}
          />
          <StepCard
            number="5"
            color="rose"
            title="TF-IDF Ranking"
            desc="Candidate documents are scored using Term Frequency × Inverse Document Frequency. Documents matching more query terms rank higher."
            active={true}
          />
          {expandedTerms.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Terms Added This Search</p>
              <div className="flex flex-wrap gap-2">
                {expandedTerms.map(t => (
                  <span key={t} className="text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full font-medium">
                    + {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StepCard({ number, color, title, desc, active }) {
  const colors = {
    blue:   'bg-blue-500',
    violet: 'bg-violet-500',
    emerald:'bg-emerald-500',
    amber:  'bg-amber-500',
    rose:   'bg-rose-500',
  };
  return (
    <div className={`flex gap-3 ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-7 h-7 rounded-full ${colors[color]} flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}>
        {number}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
          {active
            ? <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold">ON</span>
            : <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold">OFF</span>
          }
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

// ── Toggle Switch ───────────────────────────────────────────────────────────
function Toggle({ label, value, onChange, color = 'brand' }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition-all ${
        value
          ? 'bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300'
      }`}
    >
      {value ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
      {label}
    </button>
  );
}

// ── Main ResultsPage ────────────────────────────────────────────────────────
export default function ResultsPage({
  query, setQuery, handleSearch, isSearching,
  results, instantAnswer, backendError,
  expandedTerms, originalTerms, searchTime, totalFound,
  useWordNet, setUseWordNet, useBert, setUseBert,
  useFeedback, setUseFeedback,
  explainingId, toggleAI, loadingId, explanations, formatAIText,
  openDocument, scratchpadInput, setScratchpadInput,
  handleScratchpadCompute, scratchpadLoading, wolframResults,
  setView, toggleDarkMode, isDarkMode,
}) {
  const [selectedTopics, setSelectedTopics] = React.useState([]);
  const [minScore, setMinScore] = React.useState(0);
  const [showWhyModal, setShowWhyModal] = React.useState(false);

  const relatedSuggestions = React.useMemo(() => getRelatedSuggestions(query), [query]);

  const topicCounts = React.useMemo(() =>
    results.reduce((acc, doc) => {
      const t = doc.topic || 'Uncategorized';
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {}), [results]);

  const filteredResults = React.useMemo(() =>
    results.filter(doc => {
      const topicMatch = selectedTopics.length === 0 || selectedTopics.includes(doc.topic || 'Uncategorized');
      const scoreMatch = parseFloat(doc.score) >= minScore;
      return topicMatch && scoreMatch;
    }), [results, selectedTopics, minScore]);

  const toggleTopic = t => setSelectedTopics(prev =>
    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const allQueryTerms = [...(originalTerms || []), ...(expandedTerms || [])];

  return (
    <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">

      {/* ── Topbar ── */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center gap-4 sticky top-0 z-20">
        <button onClick={() => setView('landing')} className="font-display text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap hover:opacity-80 transition-opacity">
          Math<span className="text-brand">Search</span>
        </button>

        <div className="flex-1 max-w-2xl flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 gap-3 focus-within:ring-2 focus-within:ring-brand/20 focus-within:border-brand transition-all">
          <SearchIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 py-2 bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder="Search math concepts..."
          />
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleDarkMode} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button onClick={() => setView('dashboard')} className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-brand transition-colors px-3">
            <LayoutDashboard className="w-4 h-4" />
          </button>
          <button onClick={() => handleSearch()} disabled={isSearching}
            className="bg-brand hover:bg-brand-dark disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
            {isSearching ? 'Searching…' : 'Search'}
          </button>
        </div>
      </header>

      {/* ── Advanced Toggles Bar ── */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enhancements:</span>
        <Toggle label="WordNet Synonyms" value={useWordNet} onChange={setUseWordNet} />
        <Toggle label="Semantic Search" value={useBert} onChange={setUseBert} />
        <Toggle label="Relevance Feedback" value={useFeedback} onChange={setUseFeedback} />
        <button
          onClick={() => setShowWhyModal(true)}
          className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Why these results?
        </button>
      </div>

      {/* ── Stats & Topic Filter Bar ── */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-6 py-2 flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-3 flex-shrink-0 text-xs text-slate-500">
          {!isSearching && results.length > 0 && (
            <>
              <span><span className="font-bold text-slate-700 dark:text-slate-200">{totalFound}</span> results</span>
              <span className="text-slate-300 dark:text-slate-700">·</span>
              {searchTime != null && <span><span className="font-bold text-slate-700 dark:text-slate-200">{(searchTime / 1000).toFixed(3)}</span>s</span>}
              {expandedTerms.length > 0 && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span><span className="font-bold text-violet-600 dark:text-violet-400">{expandedTerms.length}</span> expansion terms</span>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2 ml-auto">
          {['All', ...Object.keys(topicCounts)].map(chip => {
            const isActive = chip === 'All' ? selectedTopics.length === 0 : selectedTopics.includes(chip);
            return (
              <button key={chip} onClick={() => chip === 'All' ? setSelectedTopics([]) : toggleTopic(chip)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-brand-light border-brand-border text-brand-dark'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                }`}>
                {chip}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="w-56 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 p-5 hidden lg:block overflow-y-auto">
          <section className="mb-8">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Topic</h4>
            <div className="space-y-3">
              {Object.entries(topicCounts).map(([topic, count]) => (
                <label key={topic} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={selectedTopics.includes(topic)} onChange={() => toggleTopic(topic)}
                    className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{topic}</span>
                  <span className="ml-auto text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">{count}</span>
                </label>
              ))}
              {Object.keys(topicCounts).length === 0 && <p className="text-xs text-slate-400 italic">No topics found.</p>}
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800 mb-8" />

          <section>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">TF-IDF Score</h4>
            <div className="space-y-3">
              {[{ label: 'Any Score', value: 0 }, { label: 'Above 0.1', value: 0.1 }, { label: 'Above 0.3', value: 0.3 }, { label: 'Above 0.5', value: 0.5 }].map(item => (
                <label key={item.label} className="flex items-center gap-3 cursor-pointer group">
                  <input type="radio" name="score_filter" checked={minScore === item.value} onChange={() => setMinScore(item.value)}
                    className="w-4 h-4 border-slate-300 text-brand focus:ring-brand" />
                  <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{item.label}</span>
                </label>
              ))}
            </div>
          </section>
        </aside>

        {/* Results Area */}
        <main className="flex-1 overflow-y-auto bg-transparent p-6 relative z-10">
          <div className="max-w-3xl mx-auto space-y-4">

            {isSearching ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 animate-pulse">
                    <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mb-4" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-full mb-2" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
                  </div>
                ))}
              </div>
            ) : backendError ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center text-red-800 dark:text-red-400">
                <div className="font-semibold mb-2">Search Error</div>
                <div className="text-sm">{backendError}</div>
              </div>
            ) : results.length > 0 ? (
              <>
                {/* Expanded Query Chips */}
                {(expandedTerms.length > 0 || (originalTerms && originalTerms.length > 0)) && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-200 dark:border-violet-800/50 rounded-xl p-4"
                  >
                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-3">
                      {expandedTerms.length > 0 ? 'Showing results for expanded query:' : 'Showing results for:'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(originalTerms || []).map(t => (
                        <span key={`orig-${t}`} className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full font-medium">
                          {t}
                        </span>
                      ))}
                      {expandedTerms.map(t => (
                        <span key={`exp-${t}`} className="text-xs bg-violet-600 text-white px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {t}
                        </span>
                      ))}
                    </div>
                    {expandedTerms.length > 0 && (
                      <p className="text-[10px] text-violet-400 mt-2">
                        ✦ Purple badges are terms added by AI expansion
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Related Suggestions */}
                {relatedSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 flex-wrap"
                  >
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Related:</span>
                    {relatedSuggestions.map(s => (
                      <button key={s} onClick={() => handleSearch(s)}
                        className="text-xs px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-brand-light hover:border-brand-border hover:text-brand-dark transition-all">
                        {s}
                      </button>
                    ))}
                  </motion.div>
                )}

                <div className="space-y-3">
                  {/* Instant Answer Panel */}
                  {instantAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl mb-6 ring-1 ring-white/10"
                    >
                      <div className="bg-slate-800/50 px-5 py-3.5 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                          <span className="text-[10px] font-bold text-white uppercase tracking-widest">Computational Knowledge Engine</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-brand/20 px-2 py-0.5 rounded border border-brand/30">
                          <Zap className="w-3 h-3 text-brand" />
                          <span className="text-[9px] font-extrabold text-brand uppercase">Verified</span>
                        </div>
                      </div>
                      <div className="p-6">
                        {instantAnswer.result && (
                          <div className="mb-4">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Direct Computation</h4>
                            <p className="text-xl font-bold text-white font-mono tracking-tight leading-snug">{instantAnswer.result}</p>
                          </div>
                        )}
                        {instantAnswer.imageUrl && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Visual Logic</h4>
                            <div className="bg-white rounded-xl p-3 flex justify-center shadow-lg">
                              <img src={instantAnswer.imageUrl} alt="Computation" referrerPolicy="no-referrer" className="max-w-full h-auto" />
                            </div>
                          </div>
                        )}
                        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                          <p className="text-[10px] text-slate-500 font-medium italic">Computed via Wolfram Alpha Inference V2</p>
                          <button className="text-[10px] font-bold text-brand hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1.5">
                            Full Analysis <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {filteredResults.map((doc, idx) => (
                    <ResultCard
                      key={`${doc.id}-${idx}`}
                      doc={doc}
                      explainingId={explainingId}
                      toggleAI={toggleAI}
                      loadingId={loadingId}
                      explanations={explanations}
                      formatAIText={formatAIText}
                      openDocument={openDocument}
                      scratchpadInput={scratchpadInput}
                      setScratchpadInput={setScratchpadInput}
                      handleScratchpadCompute={handleScratchpadCompute}
                      scratchpadLoading={scratchpadLoading}
                      wolframResults={wolframResults}
                      highlightTerms={allQueryTerms}
                    />
                  ))}
                  {filteredResults.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-slate-500 dark:text-slate-400">No results match your selected filters.</p>
                      <button onClick={() => { setSelectedTopics([]); setMinScore(0); }} className="mt-4 text-brand hover:underline text-sm font-medium">
                        Clear Filters
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20">
                <SearchIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No results found</h3>
                <p className="text-sm text-slate-500">Try enabling WordNet or Semantic Search above, or refine your query.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Why Modal */}
      <AnimatePresence>
        {showWhyModal && (
          <WhyModal
            onClose={() => setShowWhyModal(false)}
            useWordNet={useWordNet}
            useBert={useBert}
            useFeedback={useFeedback}
            expandedTerms={expandedTerms}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
