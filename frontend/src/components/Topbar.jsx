import { useAuthStore } from '../store/authStore';
import { Bell, Search } from 'lucide-react';

function Topbar() {
  const { user } = useAuthStore();

  return (
    <header className="h-16 w-full glass-panel !rounded-none !border-x-0 !border-t-0 flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="relative w-64">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search executions..." 
          className="input-field pl-10 h-9 bg-slate-900/50 border-white/5 text-sm"
        />
      </div>

      <div className="flex items-center gap-5">
        <button className="relative p-2 text-slate-300 hover:text-white transition-colors">
          <Bell size={18} className="animate-pulse-slow" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger animate-pulse"></span>
        </button>

        <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right">
            <p className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{user?.full_name}</p>
            <p className="text-xs text-textMuted capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <img 
            src={user?.avatar} 
            alt="avatar" 
            className="w-9 h-9 rounded-full ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all object-cover"
          />
        </div>
      </div>
    </header>
  );
}

export default Topbar;
