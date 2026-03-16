import React, { useState, useEffect } from 'react';
import { BellRing, Archive, RefreshCw } from 'lucide-react';
import api from '../api';

export default function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifs(res.results || res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/', {});
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      alert('Failed to mark all as read');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/mark_read/`, {});
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-10 text-white animate-pulse">Loading inbox...</div>;

  return (
    <div className="max-w-3xl flex flex-col gap-6 w-full mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-textMuted">System alerts and direct inbox messages.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchNotifs} className="btn-secondary text-sm !border-white/10"><RefreshCw size={16} /> Refresh</button>
          <button onClick={handleMarkAllRead} className="btn-secondary text-sm !border-white/10"><Archive size={16} /> Mark All Read</button>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {notifs.length === 0 ? (
           <div className="p-20 text-center text-slate-500 italic">No notifications yet.</div>
        ) : notifs.map((n, i) => (
          <div 
            key={n.id} 
            onClick={() => !n.is_read && handleMarkRead(n.id)}
            className={`p-4 flex items-start gap-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors cursor-pointer ${!n.is_read ? 'bg-primary/5' : ''}`}
          >
             <div className="mt-1 relative px-1">
               <BellRing size={16} className={!n.is_read ? 'text-primary' : 'text-slate-500'} />
               {!n.is_read && <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary animate-ping"></div>}
             </div>
             <div className="flex-1">
               <h4 className={`text-sm tracking-tight ${!n.is_read ? 'text-white font-semibold' : 'text-slate-300 font-medium'}`}>{n.title}</h4>
               <p className="text-sm text-slate-400 mt-1">{n.message}</p>
             </div>
             <div className="text-xs text-slate-500 whitespace-nowrap">{new Date(n.created_at).toLocaleTimeString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
