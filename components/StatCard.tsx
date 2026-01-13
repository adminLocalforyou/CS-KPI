import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'emerald' | 'orange' | 'indigo';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  };

  return (
    <div className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col justify-between">
      <div className="flex items-start justify-between mb-6">
        <div className={`p-4 rounded-2xl flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        <div className="text-right">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
          <h4 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h4>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">{sub}</p>
      </div>
    </div>
  );
};

export default StatCard;