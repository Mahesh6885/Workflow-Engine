import { NavLink } from 'react-router-dom';
import { LayoutDashboard, GitMerge, Activity, CheckSquare, Bell, Settings } from 'lucide-react';
import clsx from 'clsx';

function Sidebar() {
  const tabs = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Workflows', icon: GitMerge, path: '/workflows' },
    { label: 'Monitor', icon: Activity, path: '/monitor' },
    { label: 'Approvals', icon: CheckSquare, path: '/approvals' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
  ];

  return (
    <div className="w-64 h-full bg-surface border-r border-white/5 flex flex-col items-center py-6 px-4 shrink-0 transition-all duration-300 relative z-20">
      <div className="flex items-center gap-3 w-full mb-10 px-2">
        <div className="h-8 w-8 rounded bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
          <GitMerge size={18} className="text-white relative left-0.5" />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400 tracking-tight">
          HalleyX
        </span>
      </div>

      <nav className="w-full flex-1 flex flex-col gap-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => clsx(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-medium group',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-textMuted hover:bg-white/5 hover:text-white'
            )}
          >
            <tab.icon size={18} className="transition-transform group-hover:scale-110" />
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="w-full mt-auto pt-4 border-t border-white/5">
        <button className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-textMuted hover:bg-white/5 transition-all text-sm font-medium">
          <Settings size={18} /> Settings
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
