import React from 'react';
import { LucideIcon, Lock } from 'lucide-react';

interface SidebarItemProps {
  id: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed?: boolean;
  isLocked?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ label, icon: Icon, active, collapsed, isLocked, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 translate-x-1' 
        : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
      } ${collapsed ? 'justify-center' : ''}`}
    >
      <div className="flex items-center gap-3">
        <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-white'} />
        {!collapsed && <span className="font-bold text-sm tracking-tight">{label}</span>}
      </div>
      {!collapsed && isLocked && !active && (
        <Lock size={12} className="text-slate-600 group-hover:text-slate-400" />
      )}
    </button>
  );
};

export default SidebarItem;