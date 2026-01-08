
import React, { useState, useMemo } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  FileText, 
  PlusCircle, 
  FileSearch, 
  Award,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Clock,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { EvaluationRecord, QARecord, TestSubmission } from '../types.ts';
import { TEAM_MEMBERS } from '../constants.tsx';

interface MasterRecordProps {
  evaluations: EvaluationRecord[];
  qaRecords: QARecord[];
  submissions: TestSubmission[];
}

type RecordType = 'performance' | 'qa' | 'exam';

const MasterRecord: React.FC<MasterRecordProps> = ({ evaluations, qaRecords, submissions }) => {
  const [filterType, setFilterType] = useState<'all' | RecordType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');

  const allRecords = useMemo(() => {
    const records = [
      ...evaluations.map(e => ({ 
        id: e.id, 
        type: 'performance' as const, 
        staffName: e.staffName, 
        date: e.date, 
        title: e.type, 
        score: Math.round((e.communicationScore + e.speedScore + e.processCompliance) / 3),
        detail: e.note || 'No additional notes provided'
      })),
      ...qaRecords.map(q => ({ 
        id: q.id, 
        type: 'qa' as const, 
        staffName: q.staffName, 
        date: q.date, 
        title: 'QA Audit', 
        score: q.overallPercentage,
        detail: `Verified across ${q.sections.length} sections`
      })),
      ...submissions.filter(s => s.isGraded).map(s => ({ 
        id: s.id, 
        type: 'exam' as const, 
        staffName: s.staffName, 
        date: s.date, 
        title: s.testTitle, 
        score: Math.round(((s.autoScore + s.manualScore) / s.totalPossiblePoints) * 100),
        detail: s.managerFeedback || 'Final grade finalized'
      }))
    ];

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [evaluations, qaRecords, submissions]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      const matchesType = filterType === 'all' || r.type === filterType;
      const matchesStaff = selectedStaff === 'all' || r.staffName === selectedStaff;
      const matchesSearch = r.staffName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesStaff && matchesSearch;
    });
  }, [allRecords, filterType, searchQuery, selectedStaff]);

  const typeStyles = {
    performance: { icon: PlusCircle, color: 'indigo', label: 'Perf Log' },
    qa: { icon: FileSearch, color: 'emerald', label: 'QA Audit' },
    exam: { icon: Award, color: 'blue', label: 'Exam Result' }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><Database size={240} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-lg shadow-indigo-500/30"><Database size={40} /></div>
            <div>
              <h2 className="text-4xl font-black tracking-tight">Master Record Deck</h2>
              <p className="text-slate-400 text-lg mt-1 font-medium italic">Consolidated history of all performance audits, QA checks, and exams</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase">Perf Logs</p>
              <p className="text-2xl font-black">{evaluations.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase">QA Audits</p>
              <p className="text-2xl font-black">{qaRecords.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase">Exams</p>
              <p className="text-2xl font-black">{submissions.filter(s => s.isGraded).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by staff or topic..." 
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-800 outline-none focus:border-indigo-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            className="flex-1 md:w-48 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none cursor-pointer"
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
          >
            <option value="all">All Staff</option>
            {TEAM_MEMBERS.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto whitespace-nowrap">
            {(['all', 'performance', 'qa', 'exam'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterType === type ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Record List */}
      <div className="space-y-6">
        {filteredRecords.length === 0 ? (
          <div className="py-24 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 space-y-4">
            <FileText size={64} />
            <p className="font-black uppercase tracking-widest">No records found matching filters</p>
          </div>
        ) : (
          filteredRecords.map((r) => {
            const style = typeStyles[r.type];
            return (
              <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-8 group">
                <div className="flex items-center gap-6">
                  <div className={`p-5 rounded-2xl bg-${style.color}-50 text-${style.color}-600`}>
                    <style.icon size={28} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-${style.color}-100 text-${style.color}-700`}>
                        {style.label}
                      </span>
                      <p className="text-xs text-slate-400 font-bold flex items-center gap-1">
                        <Calendar size={12} /> {r.date}
                      </p>
                    </div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{r.title}</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-slate-100 rounded-lg flex items-center justify-center font-black text-[9px] text-slate-400">
                        {r.staffName.substring(0,2).toUpperCase()}
                      </div>
                      <p className="text-sm font-bold text-slate-600">{r.staffName}</p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 md:px-12">
                   <p className="text-sm text-slate-500 italic font-medium leading-relaxed max-w-lg">
                     "{r.detail}"
                   </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Score</p>
                    <div className="flex items-center gap-3">
                       <span className={`text-3xl font-black ${r.score >= 85 ? 'text-emerald-600' : r.score >= 70 ? 'text-blue-600' : 'text-rose-600'}`}>
                         {r.score}%
                       </span>
                       <div className="h-10 w-1 bg-slate-50 rounded-full overflow-hidden">
                          <div className={`w-full bg-${style.color}-500`} style={{height: `${r.score}%`}}></div>
                       </div>
                    </div>
                  </div>
                  <button className="p-3 text-slate-200 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10">
         <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-6">
            <h3 className="text-xl font-black flex items-center gap-3">
               <TrendingUp className="text-indigo-400" /> Retention Trends
            </h3>
            <div className="space-y-4">
               <p className="text-sm text-slate-400 font-medium leading-relaxed">
                 Master Record keeps 100% of historical data since the first submission. 
                 This data is used to calculate the Global Performance Index and Individual Growth Curves.
               </p>
               <div className="flex items-center gap-4 text-xs font-black uppercase text-indigo-400">
                  <div className="flex items-center gap-1"><Clock size={12}/> Lifetime logs active</div>
                  <div className="flex items-center gap-1"><BarChart3 size={12}/> Auto-sync enabled</div>
               </div>
            </div>
         </div>
         <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
               <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-1">Global Audit Average</h4>
               <p className="text-6xl font-black text-slate-900 tracking-tighter">
                 {allRecords.length > 0 ? Math.round(allRecords.reduce((a, b) => a + b.score, 0) / allRecords.length) : 0}%
               </p>
            </div>
            <div className="pt-6 border-t border-slate-50 flex items-center gap-2">
               <ShieldCheck className="text-emerald-500" size={18} />
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Validated Compliance Data</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default MasterRecord;
