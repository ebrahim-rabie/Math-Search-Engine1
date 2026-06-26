import React from 'react';
import { History, ArrowRight } from 'lucide-react';

export function LogsTable({ persistentHistory, setPersistentHistory, setSolverInput, setView, runSolver, handleSearch }) {
  return (
    <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3rem] shadow-sm overflow-hidden">
      <div className="p-8 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
            <History className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">System Execution Logs</h3>
            <p className="text-xs text-slate-400 font-medium">Persistent history of computational inferences and search queries</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100 dark:border-emerald-900/50">
            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
            Storage: history.json
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              {['Timestamp', 'Type', 'Query / Expression', 'Output Preview', 'Actions'].map((head) => (
                <th key={head} className="px-10 py-5 text-[10px] font-bold text-slate-900 dark:text-slate-400 uppercase tracking-[0.2em]">{head}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {persistentHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-10 py-12 text-center text-slate-400 italic text-sm">
                  No persistent records found. Start searching or solving to populate the logs.
                </td>
              </tr>
            ) : (
              persistentHistory.map((item, i) => (
                <tr key={item.id || i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group">
                  <td className="px-10 py-6 text-xs font-mono text-slate-500">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-10 py-6">
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-tighter ${
                      item.type === 'solver' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-brand/10 text-brand'
                    }`}>
                      {item.type || 'search'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <code className="text-xs font-bold text-slate-900 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 truncate max-w-[200px] block">
                      {item.query}
                    </code>
                  </td>
                  <td className="px-10 py-6">
                    <p className="text-xs text-slate-500 font-medium truncate max-w-[300px]">
                      {item.result}
                    </p>
                  </td>
                  <td className="px-10 py-6">
                    <button 
                      onClick={() => {
                        if (item.type === 'solver') {
                          setSolverInput(item.query);
                          setView('solver');
                          runSolver(item.query);
                        } else {
                          handleSearch(item.query);
                        }
                      }}
                      className="p-2 hover:bg-white dark:hover:bg-slate-700 hover:border-brand border border-transparent rounded-xl transition-all text-slate-400 hover:text-brand"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-10 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Live Stream from Root Storage Layer
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPersistentHistory([])} className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand transition-all shadow-sm">
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
}
