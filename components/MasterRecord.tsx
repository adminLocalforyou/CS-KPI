
import React, { useState, useMemo } from 'react';
import { 
  Database, Search, PlusCircle, 
  FileSearch, ShieldCheck, X, Archive, Calendar
} from 'lucide-react';
import { EvaluationRecord, QARecord, MonthlySnapshotRecord } from '../types.ts';
import { TEAM_MEMBERS } from '../constants.tsx';

interface MasterRecordProps {
  evaluations: EvaluationRecord[];
  qaRecords: QARecord[];
  monthlySnapshots?: MonthlySnapshotRecord[];
  onClearAll: () => void;
}

type RecordType = 'performance' | 'qa' | 'monthly_snapshot';

interface GenericRecord {
  id: string;
  type: RecordType;
  staffName: string;
  date: string;
  title: string;
  score: number;
  detail: string;
  rawData: any;
}

const MasterRecord: React.FC<MasterRecordProps> = ({ evaluations, qaRecords, monthlySnapshots = [], onClearAll }) => {
  const [filterType, setFilterType] = useState<'all' | RecordType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [viewingRecord, setViewingRecord] = useState<GenericRecord | null>(null);

  const allRecords = useMemo(() => {
    const records: GenericRecord[] = [
      ...evaluations.map(e => ({ 
        id: e.id, 
        type: 'performance' as const, 
        staffName: e.staffName, 
        date: e.date, 
        title: e.type, 
        score: Math.round((e.communicationScore + e.speedScore + e.processCompliance) / 3),
        detail: e.note || 'No notes',
        rawData: e
      })),
      ...qaRecords.map(q => ({ 
        id: q.id, 
        type: 'qa' as const, 
        staffName: q.staffName, 
        date: q.date, 
        title: 'QA Audit', 
        score: q.overallPercentage,
        detail: `Verified across ${q.sections.length} sections`,
        rawData: q
      })),
      ...monthlySnapshots.map(s => ({
        id: s.id,
        type: 'monthly_snapshot' as const,
        staffName: 'Global Team',
        date: s.date,
        title: `Monthly Archive: ${s.monthYear}`,
        score: s.overallScore,
        detail: `SLA & Growth Snapshot`,
        rawData: s
      }))
    ];
    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [evaluations, qaRecords, monthlySnapshots]);

  const filteredRecords = useMemo(() => {
    return allRecords.filter(r => {
      const matchesType = filterType === 'all' || r.type === filterType;
      const matchesStaff = selectedStaff === 'all' || r.staffName === selectedStaff;
      const matchesSearch = r.staffName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesStaff && matchesSearch;
    });
  }, [allRecords, filterType, searchQuery, selectedStaff]);

  const renderDetailContent = () => {
    if (!viewingRecord) return null;
    
    if (viewingRecord.type === 'monthly_snapshot') {
      const s = viewingRecord.rawData as MonthlySnapshotRecord;
      return (
        <div className="space-y-8">
           <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase">Restaurant SLA</p>
                 <p className="text-2xl font-black">{s.projectSLA.restaurant.met}/{s.projectSLA.restaurant.total}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase">Massage SLA</p>
                 <p className="text-2xl font-black">{s.projectSLA.massage.met}/{s.projectSLA.massage.total}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase">AI SLA</p>
                 <p className="text-2xl font-black">{s.projectSLA.ai.met}/{s.projectSLA.ai.total}</p>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 text-blue-700 rounded-2xl">
                 <p className="text-[10px] font-black uppercase">CSAT Avg</p>
                 <p className="text-2xl font-black">{s.otherKPIs.csat.met}/5</p>
              </div>
              <div className="p-4 bg-indigo-50 text-indigo-700 rounded-2xl">
                 <p className="text-[10px] font-black uppercase">Response Speed</p>
                 <p className="text-2xl font-black">{s.otherKPIs.responseSpeed.met}m</p>
              </div>
           </div>
        </div>
      );
    }

    if (viewingRecord.type === 'qa') {
      const qa = viewingRecord.rawData as QARecord;
      return (
        <div className="space-y-6">
          {qa.sections.map((section, idx) => (
            <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <h5 className="font-black text-slate-800 mb-2">{section.title}</h5>
              <div className="space-y-2">
                {section.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs font-bold text-slate-600">
                    <span>{it.label}</span>
                    <span>{it.score}/5</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    const ev = viewingRecord.rawData as EvaluationRecord;
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
             <p className="text-[10px] font-black text-slate-400">Incoming</p>
             <p className="text-xl font-black">{ev.incomingCalls}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl">
             <p className="text-[10px] font-black text-slate-400">Outgoing</p>
             <p className="text-xl font-black">{ev.outgoingCalls}</p>
          </div>
        </div>
        <p className="text-sm italic font-medium">"{ev.note}"</p>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in">
      {viewingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
           <div className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden p-10 space-y-8 animate-in zoom-in-95">
              <div className="flex justify-between items-start">
                 <h3 className="text-2xl font-black">{viewingRecord.title}</h3>
                 <button onClick={() => setViewingRecord(null)} className="p-2 text-slate-400 hover:text-black transition-colors"><X size={24}/></button>
              </div>
              <div className="pb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{viewingRecord.staffName} • {viewingRecord.date}</p>
              </div>
              {renderDetailContent()}
           </div>
        </div>
      )}

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <Database size={240} className="absolute top-0 right-0 p-12 opacity-5" />
        <div className="flex items-center gap-6">
          <Database size={40} className="text-indigo-600" />
          <div>
            <h2 className="text-4xl font-black tracking-tight">Master Record Deck</h2>
            <p className="text-slate-400 font-medium">Consolidated history of performance audits, QA checks, and monthly snapshots</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center border border-slate-100 shadow-sm">
        <div className="flex-1 w-full relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 font-bold" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black" value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
            <option value="all">All Types</option>
            <option value="performance">Perf Log</option>
            <option value="qa">QA Audit</option>
            <option value="monthly_snapshot">Snapshots</option>
          </select>
          <select className="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black" value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)}>
            <option value="all">All Staff</option>
            {TEAM_MEMBERS.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredRecords.map(r => (
          <div key={r.id} onClick={() => setViewingRecord(r)} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${
                r.type === 'qa' ? 'bg-emerald-50 text-emerald-600' : 
                r.type === 'monthly_snapshot' ? 'bg-amber-50 text-amber-600' : 
                'bg-indigo-50 text-indigo-600'
              }`}>
                {r.type === 'qa' ? <ShieldCheck size={24} /> : r.type === 'monthly_snapshot' ? <Archive size={24} /> : <PlusCircle size={24} />}
              </div>
              <div>
                <h4 className="font-black text-slate-900">{r.title}</h4>
                <p className="text-xs text-slate-400 font-bold flex items-center gap-2"><Calendar size={12}/> {r.date} • {r.staffName}</p>
              </div>
            </div>
            <div className="text-2xl font-black text-slate-800">{r.score}%</div>
          </div>
        ))}
      </div>
      
      {filteredRecords.length === 0 && (
        <div className="py-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-200">
           <Database size={48} className="mx-auto mb-4" />
           <p className="font-black uppercase tracking-widest">No matching records found</p>
        </div>
      )}
    </div>
  );
};

export default MasterRecord;
