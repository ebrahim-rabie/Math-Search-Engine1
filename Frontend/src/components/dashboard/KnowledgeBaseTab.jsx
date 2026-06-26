import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { MathJax } from 'better-react-mathjax';
import { INDEX_TERMS } from '../../constants';

export function KnowledgeBaseTab({ stats }) {
  const terms = stats?.top_terms || INDEX_TERMS;
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {terms.map((item, i) => (
        <div key={item.term} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl hover:shadow-lg transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-2xl bg-brand/5 flex items-center justify-center group-hover:bg-brand/10 transition-colors">
              <BookOpen className="w-5 h-5 text-brand" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Entry #{i + 1}</span>
          </div>
          <MathJax>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 truncate" title={item.term}>
              {String(item.term)}
            </h3>
          </MathJax>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Frequency</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{item.frequency}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Docs</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{item.docs.length}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
            High-dimensional embedding context with semantic mapping.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Vectorized</span>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tighter">Indexed</span>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
