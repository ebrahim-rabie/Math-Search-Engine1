import React from 'react';
import { 
  ArrowRight, 
  Download, 
  Sparkles, 
  FileQuestion, 
  Activity, 
  Cpu, 
  Zap,
  Sun,
  Moon,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { MathJax } from 'better-react-mathjax';

export default function DocumentPage({
  doc,
  setView,
  isDarkMode,
  toggleDarkMode,
  loadingId,
  explanations,
  formatAIText,
  conceptProperties,
  scratchpadInput,
  setScratchpadInput,
  handleScratchpadCompute,
  scratchpadLoading,
  wolframResults,
  getSuggestedQueries
}) {
  if (!doc) return null;

  return (
    <div className={`flex flex-col min-h-screen bg-transparent relative z-10 ${isDarkMode ? 'dark' : ''}`}>
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('results')}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <ArrowRight className="w-5 h-5 rotate-180 text-slate-600 dark:text-slate-400" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{doc.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-brand uppercase tracking-widest bg-brand/5 px-2 py-0.5 rounded border border-brand/10">
                {doc.topic}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">INDEX ID: {doc.id}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleDarkMode}
            className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </button>
          <button 
            onClick={() => setView('landing')}
            className="bg-brand text-white text-xs font-bold px-5 py-2 rounded-xl hover:bg-brand-dark transition-all shadow-md shadow-brand/20"
          >
            New Search
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-10">
            {/* Full Document Section */}
            <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-[100%] opacity-50" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <History className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Research Abstract</h3>
                </div>

                <div className="space-y-6">
                  <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white leading-tight">
                    {doc.title}
                  </h1>
                  
                  <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 items-center">
                    <span className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-brand" />
                      MathSearch Verified
                    </span>
                    <span>•</span>
                    <span>Rel. Score: {doc.score}</span>
                    <span>•</span>
                    <span>Topic: {doc.topic}</span>
                  </div>

                  <div className="prose prose-slate dark:prose-invert prose-lg max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-serif">
                    {doc.full_text || doc.abstract || doc.snippet.replace(/<\/?mark>/g, '')}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4">
                    {doc?.tags?.map(tag => (
                      <span key={tag} className="text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">
                        {tag.toUpperCase()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* AI Forensic Analysis */}
            <section className="bg-brand-light/20 dark:bg-brand/5 border border-brand/20 rounded-3xl p-8 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileQuestion className="w-24 h-24 text-brand" />
              </div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-10 h-10 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20">
                  <Sparkles className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-dark dark:text-brand">AI Deep Dive</h3>
                  <p className="text-[10px] text-brand/60 font-bold uppercase tracking-widest">Synthesis & Core Logic Layer</p>
                </div>
              </div>
              
              {loadingId === doc.id ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-4 bg-brand/10 rounded w-3/4"></div>
                  <div className="h-4 bg-brand/10 rounded w-full"></div>
                  <div className="h-4 bg-brand/10 rounded w-5/6"></div>
                </div>
              ) : (
                <div className="space-y-6 relative z-10">
                  <div className="prose prose-slate dark:prose-invert prose-lg max-w-none">
                    {explanations && doc && explanations[doc.id] ? formatAIText(explanations[doc.id]) : (
                      <p className="text-slate-500 italic">No explanation available for this concept.</p>
                    )}
                  </div>
                </div>
              )}
            </section>

            {conceptProperties[doc.id] && (
              <section className="space-y-6">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <Activity className="w-3.5 h-3.5" />
                  Visual Multi-Dimensional Analysis
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(conceptProperties[doc.id]).map(([name, url]) => (
                    url && (
                      <div key={name} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm group hover:border-brand/40 transition-all">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                          {name} Pod
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </h4>
                        <div className="bg-slate-50 dark:bg-white rounded-xl p-4 flex items-center justify-center min-h-[120px]">
                          <img 
                            src={url} 
                            alt={name} 
                            referrerPolicy="no-referrer"
                            className="max-w-full h-auto mix-blend-multiply transition-transform group-hover:scale-105"
                          />
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
              <div className="bg-slate-50 dark:bg-slate-800/50 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-brand" />
                  <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Interactive Workbench</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-400">Ready</span>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {[
                    { label: 'Simplify', query: 'simplify ' },
                    { label: 'Factor', query: 'factor ' },
                    { label: 'Derivative', query: 'd/dx ' },
                    { label: 'Integral', query: 'integrate ' }
                  ].map(action => (
                    <button 
                      key={action.label}
                      onClick={() => setScratchpadInput(prev => action.query + prev)}
                      className="text-[9px] font-bold bg-brand/10 text-brand px-2 py-1 rounded-lg border border-brand/20 hover:bg-brand hover:text-white transition-all"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <input 
                    type="text"
                    value={scratchpadInput}
                    onChange={(e) => setScratchpadInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScratchpadCompute(doc.id)}
                    placeholder="Input formula..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand/30 outline-none"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {scratchpadLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-brand/50" />
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {getSuggestedQueries(doc.topic).map((s) => (
                    <button 
                      key={s}
                      onClick={() => {
                        setScratchpadInput(s);
                        handleScratchpadCompute(doc.id, s);
                      }}
                      className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-brand/40 hover:text-brand transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>

                {wolframResults[doc.id] && (wolframResults[doc.id].result || wolframResults[doc.id].imageUrl) && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4"
                  >
                    {wolframResults[doc.id].result && (
                      <div className="bg-brand/10 border border-brand/20 rounded-xl p-3">
                        <p className="text-xs font-bold text-brand">RESULT:</p>
                        <MathJax className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {String(wolframResults[doc.id].result)}
                        </MathJax>
                      </div>
                    )}
                    {wolframResults[doc.id].imageUrl && (
                      <div className="bg-white rounded-xl p-2 flex justify-center border border-slate-100">
                        <img 
                          src={wolframResults[doc.id].imageUrl} 
                          alt="Compute Graph" 
                          referrerPolicy="no-referrer"
                          className="max-w-full h-auto"
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Metadata</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 overflow-hidden">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Search Score</span>
                  <span className="text-xs font-bold text-brand ml-2">{doc.score}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 overflow-hidden">
                  <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Topic Clustered</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white ml-2">{doc.topic}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {doc?.tags?.map(tag => (
                    <span key={tag} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                      #{tag.toLowerCase().replace(/\s+/g, '')}
                    </span>
                  )) || <span className="text-[10px] text-slate-400 italic">No tags</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
