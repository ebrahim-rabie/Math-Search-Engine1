import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Sparkles, Cpu, ArrowRight, Zap } from 'lucide-react';
import { MathJax } from 'better-react-mathjax';

/**
 * Highlights occurrences of any term from `terms` inside `text`.
 * Returns an array of React nodes.
 */
function highlightText(text, terms) {
  if (!text || !terms || terms.length === 0) return text;

  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark
        key={i}
        className="bg-violet-100 dark:bg-violet-900/40 text-violet-900 dark:text-violet-200 px-0.5 rounded-sm not-italic"
      >
        {part}
      </mark>
    ) : part
  );
}

export function ResultCard({
  doc,
  explainingId,
  toggleAI,
  loadingId,
  explanations,
  formatAIText,
  openDocument,
  scratchpadInput,
  setScratchpadInput,
  handleScratchpadCompute,
  scratchpadLoading,
  wolframResults,
  highlightTerms = [],
}) {
  const isOpen = explainingId === doc.id;

  // Merge backend <mark> highlights with our expansion-term highlights
  function renderSnippet(snippet) {
    const parts = snippet.split(/(<mark>.*?<\/mark>)/);
    return parts.flatMap((part, i) => {
      if (part.startsWith('<mark>')) {
        return [
          <mark key={`bk-${i}`} className="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-200 px-0.5 rounded-sm not-italic">
            {part.replace(/<\/?mark>/g, '')}
          </mark>
        ];
      }
      return [highlightText(part, highlightTerms)];
    });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group bg-white dark:bg-slate-900 border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md ${
        isOpen
          ? 'border-brand/40 ring-1 ring-brand/10 shadow-sm'
          : 'border-slate-200 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-800/60'
      } ${doc.top ? 'border-l-4 border-l-brand' : ''}`}
    >
      <div className="p-5">
        <div className="flex justify-between items-start gap-4 mb-2">
          <button onClick={() => openDocument(doc)} className="text-left group/title flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white leading-snug group-hover/title:text-brand transition-colors flex items-center gap-2">
              <span>{highlightText(doc.title, highlightTerms)}</span>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover/title:opacity-100 transition-all -translate-x-2 group-hover/title:translate-x-0 flex-shrink-0" />
            </h3>
          </button>
          <div className="bg-brand-light dark:bg-brand/20 text-brand-dark dark:text-brand text-[10px] font-bold px-2 py-1 rounded-md border border-brand-border/50 flex-shrink-0">
            {doc.score}
          </div>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          {renderSnippet(doc.snippet || '')}
        </p>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {doc.tags.map(tag => (
              <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-md">
                {tag}
              </span>
            ))}
          </div>

          <button
            onClick={() => toggleAI(doc)}
            className={`ml-auto flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
              isOpen
                ? 'bg-brand text-white shadow-sm'
                : 'bg-brand-light text-brand-dark hover:bg-brand/10'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${loadingId === doc.id ? 'animate-pulse' : ''}`} />
            {isOpen ? 'Close AI' : 'Explain with AI'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-brand-light dark:bg-brand/10 flex items-center justify-center border border-brand-border/50">
                  <Sparkles className="w-4 h-4 text-brand" />
                </div>
                <h4 className="text-sm font-bold text-brand-dark dark:text-brand">AI Explanation — {doc.topic}</h4>
              </div>

              {loadingId === doc.id ? (
                <div className="flex items-center gap-3 text-sm text-slate-500 animate-pulse">
                  <div className="w-4 h-4 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                  Generating explanation…
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Math Workbench */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-brand" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">Interactive Math Workbench</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400">Live Engine</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={scratchpadInput}
                            onChange={e => setScratchpadInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleScratchpadCompute(doc.id)}
                            placeholder={`Experiment with ${doc.topic}…`}
                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm dark:text-white focus:ring-2 focus:ring-brand/20 outline-none pr-10"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {scratchpadLoading
                              ? <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                              : <Zap className="w-3.5 h-3.5 text-slate-300" />
                            }
                          </div>
                        </div>
                        <button
                          onClick={() => handleScratchpadCompute(doc.id)}
                          disabled={scratchpadLoading}
                          className="bg-brand text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-dark transition-all disabled:opacity-50"
                        >
                          Compute
                        </button>
                      </div>

                      {wolframResults[doc.id] && (wolframResults[doc.id].result || wolframResults[doc.id].imageUrl) && (
                        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                          {wolframResults[doc.id].result && (
                            <div className="flex items-start gap-2">
                              <ArrowRight className="w-3.5 h-3.5 text-brand mt-0.5" />
                              <MathJax className="text-sm font-bold text-slate-900 dark:text-white">
                                {String(wolframResults[doc.id].result)}
                              </MathJax>
                            </div>
                          )}
                          {wolframResults[doc.id].imageUrl && (
                            <div className="bg-white rounded-xl p-3 border border-slate-100 dark:border-slate-800 flex justify-center shadow-inner">
                              <img src={wolframResults[doc.id].imageUrl} alt="Computation Result" referrerPolicy="no-referrer" className="max-w-full h-auto" />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AI Text */}
                  <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300">
                    {formatAIText(explanations[doc.id] || '')}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
