import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle, Clock, Bell, Settings, Play, SquareTerminal } from 'lucide-react';
import clsx from 'clsx';

const ICONS = {
  task: CheckCircle,
  approval: Clock,
  notification: Bell,
  condition: GitMerge,
  delay: Clock,
  webhook: SquareTerminal,
  script: SquareTerminal,
  end: Play,
};

const COLORS = {
  task: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  approval: 'text-warning bg-warning/10 border-warning/30',
  notification: 'text-purple-400 bg-purple-400/10 border-purple-400/30',
  condition: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/30',
  delay: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
  webhook: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  script: 'text-sky-400 bg-sky-400/10 border-sky-400/30',
  end: 'text-danger bg-danger/10 border-danger/30',
};

// Simple GitMerge icon since it's not in the import list above natively if missing
function GitMerge(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M6 21V9a9 9 0 0 0 9 9"></path></svg>;
}

export default memo(({ data, selected }) => {
  const isSelected = selected;
  const t = data.step_type || 'task';
  const Icon = ICONS[t] || Settings;
  const styleStr = COLORS[t] || COLORS.task;

  return (
    <div className={clsx(
      "relative min-w-[200px] rounded-xl border border-white/10 glass-panel shadow-2xl transition-all duration-200 overflow-hidden group",
      isSelected ? "ring-2 ring-primary/60 border-primary/50" : "hover:border-white/20 hover:shadow-primary/10"
    )}>
      {/* Node Drag Handle */}
      <div className={clsx("h-1.5 w-full bg-gradient-to-r via-slate-500", styleStr.split(' ')[0].replace('text-', 'from-'))}></div>
      
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className={clsx("p-1.5 rounded-lg border", styleStr)}>
            <Icon size={14} />
          </div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t}
          </div>
        </div>
        
        <div className="text-slate-100 font-medium text-sm leading-tight pr-4">
          {data.name || 'Unnamed Step'}
        </div>
        
        {data.assigned_role && (
          <div className="mt-2 text-xs text-textMuted bg-surface/50 inline-block px-2 py-0.5 rounded border border-white/5">
            @ {data.assigned_role}
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-surface !border-2 !border-slate-500 hover:!border-primary !transition-colors" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-surface !border-2 !border-slate-500 hover:!border-primary !transition-colors" />
    </div>
  );
});
