import React, { useState, useEffect } from 'react';
import { PlayCircle, Clock, AlertTriangle, CheckCircle, Search, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';

export default function Monitor() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchExecutions = async () => {
    try {
      const res = await api.get('/executions/all/');
      // res is the paginated object { results: [...] } or the array if unwrapped
      console.log('Executions:', res);
      setExecutions(res.results || res);
    } catch (err) {
      console.error('Failed to fetch executions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();
    // Poll every 5 seconds for simulation of "live" updates
    const interval = setInterval(fetchExecutions, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredExecutions = executions.filter(ex => 
    ex.workflow_name?.toLowerCase().includes(search.toLowerCase()) ||
    ex.id?.toString().includes(search)
  );

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'running': return <PlayCircle className="text-primary animate-pulse w-5 h-5" />;
      case 'waiting': return <Clock className="text-warning w-5 h-5" />;
      case 'completed': return <CheckCircle className="text-success w-5 h-5" />;
      case 'failed': return <AlertTriangle className="text-danger w-5 h-5" />;
      default: return <Clock className="text-slate-400 w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Live Monitor</h1>
          <p className="text-textMuted">Real-time status of all workflow executions.</p>
        </div>
        <button onClick={fetchExecutions} className="btn-secondary !py-2 text-sm flex items-center gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        {[
          { label: 'All', value: executions.length },
          { label: 'Running', value: executions.filter(e => e.status === 'running').length },
          { label: 'Waiting', value: executions.filter(e => e.status === 'waiting').length },
          { label: 'Failed', value: executions.filter(e => e.status === 'failed').length },
        ].map((s, i) => (
           <div key={i} className="glass-panel text-center py-3 text-sm font-semibold text-slate-300">
              {s.label} <span className="block text-xl text-white mt-1">{s.value}</span>
           </div>
        ))}
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-surface/50 flex justify-between">
           <div className="relative w-72">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
              type="text" 
              placeholder="Search by ID or workflow..." 
              className="input-field pl-10 h-8 text-sm" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
             />
           </div>
           <select className="bg-surface border-white/10 input-field w-auto h-8 !py-1 text-sm"><option>All Statuses</option><option>Running</option></select>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 text-slate-400 text-sm font-medium border-b border-white/10 uppercase tracking-wider">
               <th className="p-4 pl-6 font-medium">Status & ID</th>
               <th className="p-4 font-medium">Workflow</th>
               <th className="p-4 font-medium">Current Step</th>
               <th className="p-4 font-medium">Progress</th>
               <th className="p-4 font-medium">Timing</th>
               <th className="p-4 text-right pr-6 font-medium">Triggered By</th>
            </tr>
          </thead>
          <tbody className="text-sm">
             {filteredExecutions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500 italic">No executions found.</td>
                </tr>
             ) : filteredExecutions.map(ex => (
               <tr key={ex.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                 <td className="p-4 pl-6 text-slate-300 flex items-center gap-3">
                   <StatusIcon status={ex.status} />
                   <span className="font-mono text-xs uppercase text-slate-500">{String(ex.id).split('-')[0]}</span>
                 </td>
                 <td className="p-4 text-white font-medium">{ex.workflow_name}</td>
                 <td className="p-4 text-slate-400 truncate max-w-[200px]">{ex.current_step || '—'}</td>
                 <td className="p-4">
                   <div className="flex items-center gap-3 w-32">
                     <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden border border-white/5 relative">
                        <div className={clsx("absolute top-0 bottom-0 left-0 transition-all duration-1000", ex.status === 'failed' ? 'bg-danger' : ex.status === 'completed' ? 'bg-success' : 'bg-primary')} style={{ width: `${ex.progress_percent || 0}%` }}></div>
                     </div>
                     <span className="text-xs text-slate-500 w-8">{ex.progress_percent || 0}%</span>
                   </div>
                 </td>
                 <td className="p-4 text-slate-500">{new Date(ex.created_at).toLocaleTimeString()}</td>
                 <td className="p-4 pr-6 text-right text-slate-400">{ex.triggered_by_detail?.full_name || 'System'}</td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
