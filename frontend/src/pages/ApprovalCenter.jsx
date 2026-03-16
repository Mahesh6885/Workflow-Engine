import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import api from '../api';

export default function ApprovalCenter() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/approvals/pending/');
      // res is { success: true, count: X, data: [...] } or just the array if unwrapped
      console.log('Pending Approvals:', res);
      setApprovals(res.data || res);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id, action) => {
    // Optimistic UI update
    const previousState = [...approvals];
    setApprovals(prev => prev.filter(a => a.id !== id));
    
    try {
      if (action === 'approve') {
        await api.post(`/approvals/${id}/approve/`, { comments: 'Approved via UI' });
      } else {
        const reason = prompt('Please provide a reason for rejection:');
        if (!reason) {
            setApprovals(previousState);
            return;
        }
        await api.post(`/approvals/${id}/reject/`, { reason });
      }
      // Reload on success to be sure
      fetchApprovals();
    } catch (e) {
      alert('Action failed: ' + e);
      setApprovals(previousState);
    }
  };

  if (loading) return <div className="p-10 text-slate-400 animate-pulse">Checking for pending tasks...</div>;

  return (
    <div className="max-w-4xl flex flex-col gap-6 w-full mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Approval Center</h1>
          <p className="text-textMuted">Action tasks requiring your authorization.</p>
        </div>
        <button onClick={fetchApprovals} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="space-y-4">
         {approvals.length === 0 ? (
            <div className="text-center p-20 glass-panel">
               <CheckCircle className="mx-auto text-success mb-4" size={48} />
               <p className="text-white font-semibold">You're all caught up!</p>
               <p className="text-slate-400 text-sm mt-1">No pending approval requests at this time.</p>
            </div>
         ) : approvals.map(app => {
           const isPending = app.status === 'pending';
           return (
             <div key={app.id} className={clsx(
                "glass-panel p-5 transition-all group hover:border-white/20",
                !isPending && "opacity-60 saturate-50 pointer-events-none"
             )}>
                <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                     <div className={clsx("p-2 rounded-lg border flex items-center justify-center", isPending ? "bg-warning/10 text-warning border-warning/20" : app.status === 'approved' ? "bg-success/10 text-success border-success/20" : "bg-danger/10 text-danger border-danger/20")}>
                       {isPending ? <AlertCircle size={20} /> : app.status === 'approved' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                     </div>
                     <div>
                       <h3 className="text-lg font-semibold text-white tracking-tight">{app.step_name}</h3>
                       <p className="text-xs text-primary font-medium mt-0.5">{app.workflow_name || 'Workflow Instance'}</p>
                     </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 bg-surface px-2 py-1 rounded border border-white/5 uppercase tracking-wider">{app.status}</span>
                    <p className="text-[11px] text-slate-400 mt-2">{new Date(app.created_at).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-6 mb-4">
                   <div className="flex-1 bg-slate-900/50 p-4 rounded-lg border border-white/5">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Context Snapshot</h4>
                      <div className="grid grid-cols-2 gap-y-3">
                         {Object.entries(app.context_snapshot || {}).map(([k, v]) => (
                           <div key={k}>
                             <p className="text-[10px] text-slate-500 uppercase font-medium">{k}</p>
                             <p className="text-sm font-mono text-slate-300">{String(v)}</p>
                           </div>
                         ))}
                      </div>
                   </div>
                   
                   <div className="w-1/3 flex flex-col gap-2 justify-end">
                      {isPending ? (
                        <>
                          <button onClick={() => handleAction(app.id, 'approve')} className="btn-success !py-3 font-semibold text-sm shadow-lg shadow-success/10 group-hover:scale-[1.02] transition-transform">
                            <CheckCircle size={16} /> Approve Request
                          </button>
                          <button onClick={() => handleAction(app.id, 'reject')} className="btn-danger !py-3 font-semibold text-sm transition-transform">
                            <XCircle size={16} /> Reject & Fail
                          </button>
                        </>
                      ) : (
                        <div className="text-center text-sm font-medium text-slate-400 p-4 border border-dashed border-white/10 rounded-lg">
                           Resolved: {app.status.toUpperCase()}
                        </div>
                      )}
                   </div>
                </div>
             </div>
           );
         })}
      </div>
    </div>
  );
}
