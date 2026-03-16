import React, { useState, useEffect } from 'react';
import { Activity, PlayCircle, Clock, CheckCircle, GitMerge } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';

function StatCard({ title, value, change, icon: Icon, color }) {
  const isUp = change >= 0;
  return (
    <div className="glass-panel p-5 relative overflow-hidden group hover:border-white/20 transition-all">
      <div className={clsx("absolute top-[-20%] right-[-10%] w-24 h-24 rounded-full mix-blend-screen opacity-20 blur-xl transition-all group-hover:scale-150", color)} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className="text-textMuted font-medium text-sm tracking-wide">{title}</p>
        <div className={clsx("p-2 rounded-lg bg-surface/80 shadow-md", color.replace('bg-', 'text-'))}>
           <Icon size={20} className={clsx(color.replace('bg-', 'text-'))} />
        </div>
      </div>
      <div className="flex items-end gap-3 relative z-10">
        <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">{value}</h3>
        {change !== undefined && (
            <span className={clsx("text-sm font-medium mb-1 flex items-center gap-1", isUp ? "text-success" : "text-danger")}>
                {isUp ? '↑' : '↓'} {Math.abs(change)}%
            </span>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [statsData, setStatsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit/stats/').then(data => {
        setStatsData(data);
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { title: 'Total Workflows', value: statsData?.total_workflows || 0, change: 0, icon: GitMerge, color: 'bg-primary' },
    { title: 'Active Executions', value: statsData?.active_executions || 0, change: 0, icon: Activity, color: 'bg-indigo-500' },
    { title: 'Pending Approvals', value: statsData?.pending_approvals || 0, change: 0, icon: Clock, color: 'bg-warning' },
    { title: 'Success Rate', value: `${statsData?.success_rate || 100}%`, change: 0, icon: CheckCircle, color: 'bg-success' },
  ];

  const recentActivity = statsData?.recent_activity?.length ? statsData.recent_activity : [
    { id: 1, action: 'Platform Ready', target: 'System', user: 'Admin', time: 'Just now', status: 'success' },
  ];

  if (loading) return <div className="p-10 text-white animate-pulse">Loading Analytics...</div>;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
          Overview 
          <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">Live</span>
        </h1>
        <p className="text-textMuted">Monitoring your automation ecosystem.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Execution Volume</h2>
            <select className="bg-surface border border-white/10 rounded-md px-3 py-1.5 text-sm text-slate-300 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 rounded-lg border border-white/5 bg-slate-900/50 flex items-center justify-center text-slate-500">
            [ Dynamic Analytics Chart Rendered Here ]
          </div>
        </div>

        <div className="glass-panel p-6">
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Audit Log</h2>
            <button className="text-primary hover:text-primaryHover text-sm font-medium transition-colors">View All</button>
          </div>
          <div className="flex flex-col gap-4">
            {recentActivity.map(item => (
              <div key={item.id} className="flex gap-4 items-start pb-4 border-b border-white/5 last:border-0">
                <div className={clsx(
                  "w-2 h-2 rounded-full mt-2 shrink-0 shadow-lg",
                  item.status === 'success' && 'bg-success shadow-success/50',
                  item.status === 'failed' && 'bg-danger shadow-danger/50',
                  item.status === 'running' && 'bg-primary shadow-primary/50 animate-pulse',
                  item.status === 'warning' && 'bg-warning shadow-warning/50'
                )} />
                <div className="flex-1">
                  <p className="text-slate-200 text-sm font-medium">{item.action}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{item.target} • {item.user}</p>
                </div>
                <span className="text-slate-500 text-xs font-medium whitespace-nowrap">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
