import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'emerald' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col justify-between">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl flex-shrink-0 ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        <div className="min-w-0">
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest truncate">{label}</p>
          <h4 className="text-2xl font-black text-slate-900 truncate whitespace-nowrap">{value}</h4>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{sub}</p>
    </div>
  );
};

export default StatCard;