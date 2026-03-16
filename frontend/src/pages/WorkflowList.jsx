import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Play, MoreVertical, Edit2, Archive, Copy, GitMerge } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';

export default function WorkflowList() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback dev data while endpoint is offline/empty
  const DEV_DATA = [
    { id: 'wf-1', name: 'Expense Request', category: 'Finance', status: 'published', step_count: 5, bg: 'from-blue-600/20 to-indigo-600/20', color: 'text-indigo-400' },
    { id: 'wf-2', name: 'Employee Onboarding', category: 'HR', status: 'draft', step_count: 8, bg: 'from-emerald-600/20 to-teal-600/20', color: 'text-emerald-400' },
    { id: 'wf-3', name: 'Server Access Provision', category: 'IT', status: 'published', step_count: 3, bg: 'from-rose-600/20 to-pink-600/20', color: 'text-rose-400' },
  ];

  useEffect(() => {
    // Attempt real fetch, fallback to dev data
    api.get('/workflows/').then(res => {
      setWorkflows(res.results?.length ? res.results : DEV_DATA);
    }).catch(() => setWorkflows(DEV_DATA))
      .finally(() => setLoading(false));
  }, []);

  const handleExecute = async (id) => {
    try {
      await api.post(`/workflows/${id}/execute/`, {});
      navigate('/monitor');
    } catch (err) {
      alert('Failed to execute: ' + err);
    }
  };

  if (loading) return <div className="text-slate-400 animate-pulse">Loading workflows...</div>;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Workflows</h1>
          <p className="text-textMuted">Design, simulate, and manage automation processes.</p>
        </div>
        <button 
          onClick={() => navigate('/workflows/build/new')}
          className="btn-primary shadow-primary/30 hover:shadow-primary/50"
        >
          <Plus size={18} /> New Workflow
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
        {workflows.map(wf => (
          <div key={wf.id} className="glass-panel group relative overflow-hidden flex flex-col transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
            <div className={clsx("absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full bg-gradient-to-br opacity-50 group-hover:opacity-100 transition-opacity", wf.bg || 'from-primary/20 to-purple-500/20')}></div>
            
            <div className="p-5 flex-1 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={clsx("p-2.5 rounded-xl bg-surface border border-white/5", wf.color || 'text-primary')}>
                  <GitMerge size={20} />
                </div>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "text-xs font-semibold px-2 py-0.5 rounded-full border",
                    wf.status === 'published' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
                  )}>
                    {wf.status.toUpperCase()}
                  </span>
                  <button className="text-slate-400 hover:text-white transition-colors p-1"><MoreVertical size={16} /></button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-100 mb-1 tracking-tight">{wf.name}</h3>
              <p className="text-sm text-slate-400 mb-6">{wf.category} • {wf.step_count} steps configured</p>
            </div>

            <div className="px-5 py-4 border-t border-white/5 bg-slate-900/50 flex gap-2 relative z-10 transition-colors group-hover:bg-slate-900/80">
              <button 
                onClick={() => navigate(`/workflows/build/${wf.id}`)}
                className="flex-1 flex justify-center items-center gap-2 text-sm font-medium bg-surface hover:bg-white/10 text-slate-200 py-2 rounded-lg transition-colors"
              >
                <Edit2 size={16} /> Edit Draft
              </button>
              <button 
                onClick={() => handleExecute(wf.id)}
                className="flex-1 flex justify-center items-center gap-2 text-sm font-medium bg-primary/20 hover:bg-primary/30 text-primary py-2 rounded-lg transition-colors"
              >
                <Play size={16} /> Execute
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
