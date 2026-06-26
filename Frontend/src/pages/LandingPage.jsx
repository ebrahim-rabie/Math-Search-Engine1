import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Search, 
  ArrowRight, 
  TrendingUp, 
  History, 
  LayoutDashboard, 
  Calculator, 
  Info, 
  Github, 
  Mail,
  Sun,
  Moon
} from 'lucide-react';
import { TRENDING_TOPICS } from '../constants';

export default function LandingPage({ 
  query, 
  setQuery, 
  handleSearch, 
  setView, 
  toggleDarkMode, 
  isDarkMode, 
  history,
  searchInputRef
}) {
  return (
    <motion.div 
      key="landing"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full"
    >
      <div className="absolute top-8 right-8 flex gap-3 z-50">
        <button 
          onClick={toggleDarkMode}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          title="Toggle Theme"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button 
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand transition-all shadow-sm"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          DASHBOARD
        </button>
      </div>

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center gap-2 bg-brand/5 text-brand px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border border-brand/10">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Ebrahim Rabie
        </div>
        <h1 className="text-6xl font-display font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
          Math<span className="text-brand">Search</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
          The world's most advanced mathematical search engine. 
          Find concepts, papers, and AI-powered explanations instantly.
        </p>
      </motion.div>

      <div className="w-full max-w-2xl relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand to-indigo-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-focus-within:duration-200"></div>
        <div className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xl shadow-slate-200/50">
          <Search className="w-6 h-6 text-slate-400 ml-4" />
          <input 
            ref={searchInputRef}
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 py-4 px-4 bg-transparent border-none outline-none text-lg text-slate-900 dark:text-white placeholder:text-slate-400"
            placeholder="Ask anything about math..."
            title="Enter a mathematical concept or query to find related papers and AI-powered explanations."
            autoFocus
          />
          <button 
            onClick={() => handleSearch()}
            className="bg-brand hover:bg-brand-dark text-white px-8 py-4 rounded-xl font-semibold transition-all flex items-center gap-2 group/btn"
          >
            Search
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="mt-12 w-full max-w-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
          <TrendingUp className="w-3.5 h-3.5" />
          Trending Topics
        </div>
        <div className="flex flex-wrap gap-3">
          {TRENDING_TOPICS.map((topic) => (
            <button 
              key={topic}
              onClick={() => handleSearch(topic)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand dark:hover:border-brand hover:text-brand px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 transition-all hover:shadow-md active:scale-95"
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 mt-12 w-full max-w-2xl px-4">
        <button 
          onClick={() => setView('dashboard')}
          className="flex items-center gap-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md border border-slate-200 dark:border-slate-800 hover:border-brand hover:text-brand text-slate-600 dark:text-slate-300 px-6 py-3 rounded-2xl transition-all font-bold group shadow-sm"
        >
          <LayoutDashboard className="w-5 h-5 opacity-70 group-hover:opacity-100" />
          Your Dashboard
        </button>
        <button 
          onClick={() => setView('solver')}
          className="flex items-center gap-3 bg-brand/5 border border-brand/20 hover:bg-brand/10 text-brand px-6 py-3 rounded-2xl transition-all font-bold group shadow-sm"
        >
          <Calculator className="w-5 h-5" />
          Advanced Solver
        </button>
      </div>

      {history.length > 0 && (
        <div className="mt-12 w-full max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            <History className="w-3.5 h-3.5" />
            Recent Searches
          </div>
          <div className="space-y-2">
            {history.map((h, i) => (
              <button 
                key={i}
                onClick={() => handleSearch(h)}
                className="flex items-center gap-3 text-sm text-slate-500 hover:text-brand transition-colors w-full text-left py-1"
              >
                <Search className="w-3 h-3 opacity-50" />
                {h}
              </button>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-auto py-12 flex gap-8 text-slate-400 text-sm">
        <a href="#" className="hover:text-slate-600 transition-colors flex items-center gap-1.5"><Info className="w-4 h-4" /> About</a>
        <a href="#" className="hover:text-slate-600 transition-colors flex items-center gap-1.5"><Github className="w-4 h-4" /> GitHub</a>
        <a href="#" className="hover:text-slate-600 transition-colors flex items-center gap-1.5"><Mail className="w-4 h-4" /> Contact</a>
      </footer>
    </motion.div>
  );
}
