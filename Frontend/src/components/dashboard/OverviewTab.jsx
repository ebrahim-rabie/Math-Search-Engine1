import React from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Database, 
  Zap, 
  Target,
  MousePointerClick
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { 
  ANALYTICS_DATA, 
  TOPIC_DISTRIBUTION, 
  COLORS,
  PR_CURVE_DATA,
  EMBEDDING_DATA
} from '../../constants';

export function StatCard({ i, stat }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.1 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 ${stat.bg} dark:bg-brand/10 rounded-2xl group-hover:scale-110 transition-transform`}>
          <stat.icon className={`w-5 h-5 ${stat.color}`} />
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
      </div>
      <div className="space-y-1">
        <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tighter">{stat.value}</h3>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] font-bold ${stat.trend.startsWith('+') ? 'text-emerald-500' : 'text-blue-500'}`}>
            {stat.trend}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">Since last epoch</span>
        </div>
      </div>
    </motion.div>
  );
}

export function OverviewTab({ isDarkMode, stats }) {
  return (
    <div className="space-y-8">
      {/* Top Row: CTR + Precision + Latency */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'CTR (CLICK-THROUGH)', value: '24.8%', trend: '+1.2%', icon: MousePointerClick, color: 'text-brand', bg: 'bg-brand/5' },
          { label: 'PRECISION INDEX', value: '0.982', trend: '+0.002', icon: Target, color: 'text-indigo-500', bg: 'bg-indigo-50' },
          { label: 'LATENCY (AVG)', value: '84ms', trend: '-14ms', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <StatCard key={i} i={i} stat={stat} />
        ))}
      </div>

      {/* Middle Row: Query Trends + Topics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Query Trends Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Query Trends</h3>
              <p className="text-xs text-slate-400 font-medium">Daily search volume vs AI usage</p>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-brand" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Searches</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">AI Compute</span>
              </div>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSearches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#534AB7" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#534AB7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818CF8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1E293B" : "#F1F5F9"} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: isDarkMode ? '#64748B' : '#94A3B8', fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: isDarkMode ? '#64748B' : '#94A3B8', fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', padding: '16px' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '11px', color: isDarkMode ? '#F8FAFC' : '#0F172A' }}
                />
                <Area type="monotone" dataKey="searches" stroke="#534AB7" strokeWidth={3} fillOpacity={1} fill="url(#colorSearches)" />
                <Area type="monotone" dataKey="ai" stroke="#818CF8" strokeWidth={3} fillOpacity={1} fill="url(#colorAI)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Density Chart (Topics) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm flex flex-col items-center">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6 w-full text-left">Topics</h3>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.topic_distribution || TOPIC_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {(stats?.topic_distribution || TOPIC_DISTRIBUTION).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-full space-y-3 mt-6">
            {(stats?.topic_distribution || TOPIC_DISTRIBUTION).map((topic, i) => (
              <div key={topic.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">{topic.name}</span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{topic.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Relevance + Embedding Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PR Curve */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Relevance</h3>
            <p className="text-xs text-slate-400 font-medium">Precision-Recall Curve</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={PR_CURVE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1E293B" : "#F1F5F9"} />
                <XAxis 
                  dataKey="recall" 
                  type="number"
                  domain={[0, 100]}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: isDarkMode ? '#64748B' : '#94A3B8', fontWeight: 'bold' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: isDarkMode ? '#64748B' : '#94A3B8', fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', boxShadow: '0 10px 25px rgba(0,0,0,0.3)', padding: '16px' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '11px', color: isDarkMode ? '#F8FAFC' : '#0F172A' }}
                />
                <Line type="monotone" dataKey="precision" stroke="#10B981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Embedding Scatter Plot */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Embedding Visualization</h3>
            <p className="text-xs text-slate-400 font-medium">2D PCA projection of vector space</p>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1E293B" : "#F1F5F9"} />
                <XAxis type="number" dataKey="x" name="PCA1" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#64748B' : '#94A3B8' }} />
                <YAxis type="number" dataKey="y" name="PCA2" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? '#64748B' : '#94A3B8' }} />
                <ZAxis type="number" dataKey="z" range={[50, 200]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}
                />
                <Scatter name="Algebra" data={EMBEDDING_DATA.filter(d => d.cluster === 'Algebra')} fill="#534AB7" />
                <Scatter name="Calculus" data={EMBEDDING_DATA.filter(d => d.cluster === 'Calculus')} fill="#7C3AED" />
                <Scatter name="Statistics" data={EMBEDDING_DATA.filter(d => d.cluster === 'Statistics')} fill="#10B981" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
