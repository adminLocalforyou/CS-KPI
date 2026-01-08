
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

  const iconBg = {
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    emerald: 'bg-emerald-100',
    orange: 'bg-orange-100',
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{label}</p>
          <h4 className="text-3xl font-black text-slate-900">{value}</h4>
        </div>
      </div>
      <p className="text-xs text-slate-500 font-medium">{sub}</p>
    </div>
  );
};

export default StatCard;
