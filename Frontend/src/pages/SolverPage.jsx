import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  Search, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  History, 
  Zap,
  Sun,
  Moon
} from 'lucide-react';
import { MathJax } from 'better-react-mathjax';

export default function SolverPage({
  solverInput,
  setSolverInput,
  runSolver,
  isSolving,
  solverResult,
  solverHistory,
  handleChainAction,
  setView,
  toggleDarkMode,
  isDarkMode
}) {
  return (
    <motion.div 
      key="solver"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col bg-transparent relative z-10"
    >
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-6 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center border border-brand/20">
            <Calculator className="w-6 h-6 text-brand" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Advanced Solver</h1>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Wolfram Alpha Enterprise Engine
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
            onClick={() => setView('landing')}
            className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold border border-indigo-100 dark:border-indigo-800/50">
                <Sparkles className="w-4 h-4" />
                Computational Inferences Enabled
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand to-indigo-500 rounded-3xl blur opacity-10 group-focus-within:opacity-30 transition duration-1000"></div>
              <div className="relative flex flex-col bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden focus-within:ring-4 focus-within:ring-brand/10 transition-all">
                <textarea 
                  value={solverInput}
                  onChange={(e) => setSolverInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), runSolver())}
                  placeholder="Enter equation, integral, or plot command..."
                  className="w-full bg-transparent p-6 text-xl font-mono text-slate-900 dark:text-white placeholder:text-slate-400 outline-none resize-none h-40"
                />
                
                <div className="px-6 pb-4">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-brand" />
                    Try these examples
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "integrate sin(x)^2",
                      "plot z = x^2 + y^2",
                      "x^2 - 5x + 6 = 0",
                      "derivative of log(x)*e^x",
                      "limit of (1+1/n)^n as n->inf"
                    ].map(sample => (
                      <button
                        key={sample}
                        onClick={() => {
                          setSolverInput(sample);
                          runSolver(sample);
                        }}
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl transition-all border border-slate-200 dark:border-slate-700 hover:border-brand shadow-sm active:scale-95"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex gap-2">
                    {['integrate', 'd/dx', 'plot', 'solve'].map(cmd => (
                      <button 
                        key={cmd}
                        onClick={() => setSolverInput(prev => cmd + ' ' + prev)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-500 hover:border-brand hover:text-brand transition-all"
                      >
                        {cmd}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => runSolver()}
                    disabled={isSolving || !solverInput.trim()}
                    className="bg-slate-900 dark:bg-brand hover:opacity-90 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all active:scale-95"
                  >
                    {isSolving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Compute
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {solverResult && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest px-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Direct Output
                  </div>
                  
                  {solverResult.text && (
                    <div className="bg-slate-50 dark:bg-slate-800 border-l-4 border-brand p-6 rounded-r-2xl mb-6 relative group transition-colors">
                      <MathJax className="text-2xl font-bold text-slate-900 dark:text-white font-mono tracking-tight underline decoration-brand/20 decoration-4 underline-offset-8">
                        {String(solverResult.text)}
                      </MathJax>
                      
                      <div className="mt-8 flex flex-wrap gap-2">
                        {[
                          { label: 'Simplify', action: 'simplify' },
                          { label: 'Integrate', action: 'integrate' },
                          { label: 'Differentiate', action: 'differentiate' },
                          { label: 'Find Roots', action: 'roots' }
                        ].map(c => (
                          <button 
                            key={c.label}
                            onClick={() => handleChainAction(c.action)}
                            className="bg-white/80 dark:bg-slate-700/80 backdrop-blur-md border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand transition-all flex items-center gap-1.5"
                          >
                            <ArrowRight className="w-3 h-3" />
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {solverResult.imageUrl && (
                    <div className="bg-white dark:bg-white rounded-3xl p-8 border border-slate-200 dark:border-slate-800 flex justify-center shadow-inner">
                      <img 
                        src={solverResult.imageUrl} 
                        alt="Solver Plot" 
                        referrerPolicy="no-referrer"
                        className="max-w-full h-auto"
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              Session History
            </h3>
            <div className="space-y-3">
              {solverHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No computations yet.</p>
              ) : (
                solverHistory.map((h, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      setSolverInput(h);
                      runSolver(h);
                    }}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600 group"
                  >
                    <code className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[200px]">{h}</code>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand transition-all" />
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="bg-brand rounded-[2rem] p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Step-by-Step Logic</h3>
              <p className="text-xs text-white/70 leading-relaxed mb-6">
                Premium feature: Get detailed intermediate steps for complex integrals and differential equations using our custom inference model.
              </p>
              <button className="bg-white text-brand px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-opacity-90 transition-all">
                Enable Steps
              </button>
            </div>
            <Calculator className="absolute -right-10 -bottom-10 w-48 h-48 text-white/10 rotate-12" />
          </div>
        </div>
      </main>
    </motion.div>
  );
}
