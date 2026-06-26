import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Database, 
  LayoutDashboard, 
  Library, 
  BarChart3, 
  Users, 
  Settings, 
  Clock, 
  Download, 
  Zap, 
  Activity,
  Sun,
  Moon
} from 'lucide-react';
import { 
  LineChart, 
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

import { OverviewTab } from '../components/dashboard/OverviewTab';
import { KnowledgeBaseTab } from '../components/dashboard/KnowledgeBaseTab';
import { LogsTable } from '../components/dashboard/LogsTable';
import { INGESTION_DATA } from '../constants';

export default function DashboardPage({
  dashboardTab,
  setDashboardTab,
  persistentHistory,
  setPersistentHistory,
  setView,
  toggleDarkMode,
  isDarkMode,
  setSolverInput,
  runSolver,
  handleSearch
}) {
  const [stats, setStats] = useState(null);

  const fetchData = () => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Failed to fetch dashboard stats", err));
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex bg-transparent min-h-screen transition-colors duration-300 relative z-10">
      {/* Dashboard Sidebar */}
      <aside className="w-64 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col hidden xl:flex">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-brand dark:bg-brand flex items-center justify-center">
              <Database className="w-4 h-4 text-white" />
            </div>
            <span 
              className="font-display font-bold text-lg text-slate-900 dark:text-white tracking-tight cursor-pointer"
              onClick={() => setView('landing')}
            >
              Console
            </span>
          </div>
          
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Navigation</h2>
          <nav className="space-y-1">
            {[
              { icon: LayoutDashboard, label: 'Overview' },
              { icon: Settings, label: 'System' },
            ].map((item) => (
              <button 
                key={item.label}
                onClick={() => setDashboardTab(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  dashboardTab === item.label 
                  ? 'bg-brand/5 text-brand shadow-sm shadow-brand/10' 
                  : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white transition-colors">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Engine Status</h4>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-emerald-400">Stable</span>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-brand w-3/4 rounded-full" />
            </div>
          </div>

        </div>
      </aside>

      {/* Dashboard Body */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 p-8 overflow-y-auto"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-bold text-brand uppercase tracking-[0.3em] mb-2">Internal Operations</p>
              <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
                {dashboardTab === 'Overview' ? 'System Performance' : dashboardTab}
              </h1>
            </div>
            <div className="flex gap-3 items-center">
              <button 
                onClick={toggleDarkMode}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                title="Toggle Theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={fetchData}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:border-brand hover:text-brand transition-all shadow-sm"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Refresh Data
              </button>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-brand text-white px-4 py-2.5 rounded-xl text-[11px] font-bold hover:bg-brand-dark transition-all shadow-lg active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Snapshot PDF
              </button>
            </div>
          </div>

          {/* Render Active Tab Content */}
          {dashboardTab === 'Overview' && (
            <div className="space-y-8">
              <OverviewTab isDarkMode={isDarkMode} stats={stats} />
              <LogsTable 
                persistentHistory={persistentHistory} 
                setPersistentHistory={setPersistentHistory}
                setSolverInput={setSolverInput}
                setView={setView}
                runSolver={runSolver}
                handleSearch={handleSearch}
              />
            </div>
          )}

          {dashboardTab === 'System' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem]">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Engine Configuration</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Search Depth', value: 'Deep (Vectorized)' },
                    { label: 'Auto-Compute', value: 'Enabled' },
                    { label: 'Theme Mode', value: isDarkMode ? 'Dark' : 'Light' },
                    { label: 'API Endpoint', value: 'Standard Edge' },
                    { label: 'Version', value: 'v2.4.1-stable' },
                  ].map((cfg) => (
                    <div key={cfg.label} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cfg.label}</span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{cfg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-4">Kernel Panic Simulation</h3>
                  <p className="text-xs text-slate-400 mb-8 leading-relaxed">
                    Test the system's fault tolerance and distributed error recovery mechanisms in a sandboxed environment.
                  </p>
                  <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all">
                    Initiate Security Audit
                  </button>
                </div>
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand/20 blur-[100px] rounded-full" />
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
