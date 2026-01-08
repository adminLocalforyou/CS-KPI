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
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Activity,
  PhoneIncoming,
  PhoneOutgoing,
  MessageCircle,
  Target,
  PenTool,
  Info,
  ExternalLink,
  Download,
  GraduationCap,
  Sparkles,
  Zap,
  Store,
  Stethoscope,
  Bot,
  UserMinus,
  RefreshCcw,
  Smile,
  Timer,
  LayoutDashboard
} from 'lucide-react';
import { EvaluationRecord, QARecord, TestSubmission, AssessmentRecord, MonthlySnapshotRecord } from '../types.ts';
import { TEAM_MEMBERS } from '../constants.tsx';

interface MasterRecordProps {
  evaluations: EvaluationRecord[];
  qaRecords: QARecord[];
  submissions: TestSubmission[];
  assessments: AssessmentRecord[];
  monthlySnapshots: MonthlySnapshotRecord[];
  onClearAll: () => void;
}

type RecordType = 'performance' | 'qa' | 'exam' | 'monthly_snapshot';

interface GenericRecord {
  id: string;
  type: RecordType;
  staffName: string; // "Team" for snapshots
  date: string;
  title: string;
  score: number;
  detail: string;
  rawData: any;
}

const MasterRecord: React.FC<MasterRecordProps> = ({ evaluations, qaRecords, submissions, assessments, monthlySnapshots, onClearAll }) => {
  const [filterType, setFilterType] = useState<'all' | RecordType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [viewingRecord, setViewingRecord] = useState<GenericRecord | null>(null);

  const allRecords = useMemo(() => {
    const records: GenericRecord[] = [
      ...evaluations.map(e => {
        const evalScore = (e.communicationScore + e.speedScore + e.processCompliance) / 3;
        const finalScore = e.latestTestScore ? Math.round((evalScore + e.latestTestScore) / 2) : Math.round(evalScore);
        
        return { 
          id: e.id, 
          type: 'performance' as const, 
          staffName: e.staffName, 
          date: e.date, 
          title: e.type, 
          score: finalScore,
          detail: e.note || 'No additional notes provided',
          rawData: e
        };
      }),
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
      ...submissions.filter(s => s.isGraded).map(s => ({ 
        id: s.id, 
        type: 'exam' as const, 
        staffName: s.staffName, 
        date: s.date, 
        title: s.testTitle, 
        score: Math.round(((s.autoScore + s.manualScore) / s.totalPossiblePoints) * 100),
        detail: s.managerFeedback || 'Final grade finalized',
        rawData: s
      })),
      ...monthlySnapshots.map(s => ({
        id: s.id,
        type: 'monthly_snapshot' as const,
        staffName: 'Team Global',
        date: s.date,
        title: `Dashboard Snapshot: ${s.monthYear}`,
        score: s.overallScore,
        detail: `KPIs & SLA finalized for ${s.monthYear}`,
        rawData: s
      }))
    ];

    return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [evaluations, qaRecords, submissions, monthlySnapshots]);

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
    exam: { icon: Award, color: 'blue', label: 'Exam Result' },
    monthly_snapshot: { icon: LayoutDashboard, color: 'amber', label: 'Dashboard Snapshot' }
  };

  const renderDetailContent = () => {
    if (!viewingRecord) return null;

    if (viewingRecord.type === 'monthly_snapshot') {
      const s = viewingRecord.rawData as MonthlySnapshotRecord;
      const rPct = s.projectSLA.restaurant.total > 0 ? Math.round((s.projectSLA.restaurant.met / s.projectSLA.restaurant.total) * 100) : 0;
      const mPct = s.projectSLA.massage.total > 0 ? Math.round((s.projectSLA.massage.met / s.projectSLA.massage.total) * 100) : 0;
      const aPct = s.projectSLA.ai.total > 0 ? Math.round((s.projectSLA.ai.met / s.projectSLA.ai.total) * 100) : 0;
      const csatPct = s.otherKPIs.csat.total > 0 ? Math.round((s.otherKPIs.csat.met / s.otherKPIs.csat.total) * 100) : 0;
      const retPct = s.growthMetrics.retention.startCount > 0 ? Math.round(((s.growthMetrics.retention.endCount - s.growthMetrics.retention.newCount) / s.growthMetrics.retention.startCount) * 100) : 0;
      const revPct = s.growthMetrics.returnRate.totalCount > 0 ? Math.round((s.growthMetrics.returnRate.returningCount / s.growthMetrics.returnRate.totalCount) * 100) : 0;

      return (
        <div className="space-y-12">
          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-xl">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500 rounded-2xl"><Zap size={24} /></div>
                <h4 className="text-xl font-black">Monthly Overview: {s.monthYear}</h4>
             </div>
             <div className="text-4xl font-black text-amber-400">{s.overallScore}%</div>
          </div>

          <div className="space-y-6">
            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Store size={14}/> Project SLA Finalized</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                  <p className="text-[10px] font-black text-rose-400 uppercase">Restaurant</p>
                  <p className="text-3xl font-black text-slate-800">{rPct}%</p>
                  <p className="text-[10px] font-bold text-slate-400">Met: {s.projectSLA.restaurant.met} / {s.projectSLA.restaurant.total}</p>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                  <p className="text-[10px] font-black text-emerald-400 uppercase">Massage</p>
                  <p className="text-3xl font-black text-slate-800">{mPct}%</p>
                  <p className="text-[10px] font-bold text-slate-400">Met: {s.projectSLA.massage.met} / {s.projectSLA.massage.total}</p>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-2">
                  <p className="text-[10px] font-black text-blue-400 uppercase">AI Receptionist</p>
                  <p className="text-3xl font-black text-slate-800">{aPct}%</p>
                  <p className="text-[10px] font-bold text-slate-400">Met: {s.projectSLA.ai.met} / {s.projectSLA.ai.total}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
             <div className="space-y-6">
               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Timer size={14}/> Daily KPIs</h5>
               <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800 flex items-center gap-2"><Smile size={18} className="text-emerald-500" /> CSAT Index</span>
                    <span className="text-2xl font-black text-emerald-600">{csatPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800 flex items-center gap-2"><Timer size={18} className="text-purple-500" /> Avg Response</span>
                    <span className="text-2xl font-black text-purple-600">{s.otherKPIs.responseSpeed.met} min</span>
                  </div>
               </div>
             </div>
             <div className="space-y-6">
               <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14}/> Customer Growth</h5>
               <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800 flex items-center gap-2"><UserMinus size={18} className="text-indigo-500" /> Retention</span>
                    <span className="text-2xl font-black text-indigo-600">{retPct}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-black text-slate-800 flex items-center gap-2"><RefreshCcw size={18} className="text-orange-500" /> Return Rate</span>
                    <span className="text-2xl font-black text-orange-600">{revPct}%</span>
                  </div>
               </div>
             </div>
          </div>
        </div>
      );
    }

    if (viewingRecord.type === 'exam') {
      const submission = viewingRecord.rawData as TestSubmission;
      const assessment = assessments.find(a => a.id === submission.testId);
      
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Auto Score</p>
                <p className="text-2xl font-black text-slate-800">{submission.autoScore}/{submission.totalPossiblePoints}</p>
             </div>
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Manual Score</p>
                <p className="text-2xl font-black text-slate-800">{submission.manualScore}</p>
             </div>
             <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 col-span-2">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Overall Percentage</p>
                <p className="text-3xl font-black text-blue-600">{viewingRecord.score}%</p>
             </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Question History</h5>
            {assessment?.questions.map((q, idx) => {
              const userAnswer = submission.answers[q.id];
              const isCorrect = q.type === 'choice' ? userAnswer === q.correctAnswer : true;
              
              return (
                <div key={q.id} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-xs text-slate-400 border border-slate-100">{idx + 1}</span>
                      <p className="font-bold text-slate-800">{q.question}</p>
                    </div>
                    {q.type === 'choice' ? (
                      isCorrect ? <CheckCircle2 className="text-emerald-500" size={20} /> : <AlertCircle className="text-rose-500" size={20} />
                    ) : (
                      <PenTool className="text-amber-500" size={20} />
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Staff Answer</p>
                      <div className={`text-sm font-bold p-3 rounded-xl ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {userAnswer || '(No Answer Provided)'}
                      </div>
                    </div>
                    {q.type === 'choice' && !isCorrect && (
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Correct Answer</p>
                        <div className="text-sm font-bold p-3 rounded-xl bg-slate-900 text-white">
                          {q.correctAnswer}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {submission.managerFeedback && (
            <div className="p-8 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-3">
              <h5 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                <MessageSquare size={14} /> Supervisor Feedback
              </h5>
              <p className="text-sm font-bold text-amber-900 leading-relaxed italic">"{submission.managerFeedback}"</p>
            </div>
          )}
        </div>
      );
    }

    if (viewingRecord.type === 'qa') {
      const qa = viewingRecord.rawData as QARecord;
      return (
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {qa.sections.map((section, idx) => {
              const actual = section.items.reduce((a, b) => a + b.score, 0);
              const max = section.items.length * 5;
              const pct = Math.round((actual / max) * 100);
              return (
                <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Section {idx + 1}</p>
                  <p className="text-2xl font-black text-slate-800">{pct}%</p>
                  <div className="w-full h-1 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{width: `${pct}%`}}></div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="space-y-8">
            {qa.sections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h5 className="font-black text-slate-900 text-sm flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-[10px]">{sIdx + 1}</span>
                    {section.title}
                  </h5>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">Score: {Math.round((section.items.reduce((a,b)=>a+b.score, 0) / (section.items.length * 5)) * 100)}%</span>
                </div>
                <div className="space-y-3 pl-9">
                  {section.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center justify-between text-sm p-4 bg-white border border-slate-50 rounded-2xl shadow-sm">
                      <span className="font-medium text-slate-600">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {[1,2,3,4,5].map(star => (
                            <div key={star} className={`w-2 h-2 rounded-full ${star <= item.score ? 'bg-blue-500' : 'bg-slate-100'}`}></div>
                          ))}
                        </div>
                        <span className="font-black text-slate-900 min-w-[30px] text-right">{item.score}/5</span>
                      </div>
                    </div>
                  ))}
                  {(section.caseRef || section.comment) && (
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 mt-2">
                      {section.caseRef && <div className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase"><ExternalLink size={12}/> Ticket REF: {section.caseRef}</div>}
                      {section.comment && <div className="flex gap-2">
                        <MessageSquare size={14} className="text-slate-300 mt-0.5 flex-shrink-0" />
                        <p className="text-xs font-bold text-slate-600 italic">"{section.comment}"</p>
                      </div>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (viewingRecord.type === 'performance') {
      const evalData = viewingRecord.rawData as EvaluationRecord;
      return (
        <div className="space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-4">
              <PhoneIncoming className="text-indigo-600" size={20} />
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Incoming</p>
                <p className="text-2xl font-black text-slate-800">{evalData.incomingCalls}</p>
              </div>
            </div>
            <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex items-center gap-4">
              <PhoneOutgoing className="text-indigo-600" size={20} />
              <div>
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Outgoing</p>
                <p className="text-2xl font-black text-slate-800">{evalData.outgoingCalls}</p>
              </div>
            </div>
            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 flex items-center gap-4">
              <MessageCircle className="text-emerald-600" size={20} />
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Chats</p>
                <p className="text-2xl font-black text-slate-800">{evalData.totalChats}</p>
              </div>
            </div>
            <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex items-center gap-4">
              <FileText className="text-amber-600" size={20} />
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Tasks</p>
                <p className="text-2xl font-black text-slate-800">{evalData.totalTasks}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h5 className="text-sm font-black text-slate-900 uppercase tracking-widest ml-1">Rubric Scores & Integrated Exam</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { label: 'Communication', val: evalData.communicationScore },
                 { label: 'Speed/SLA', val: evalData.speedScore },
                 { label: 'Process', val: evalData.processCompliance },
                 { label: 'Follow Up', val: evalData.followUpScore },
                 { label: 'Clarity', val: evalData.clarityScore },
                 { label: 'Onboarding', val: evalData.onboardingQuality }
               ].map((rub, i) => (
                 <div key={i} className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{rub.label}</p>
                    <div className="flex items-center justify-between">
                       <span className="text-2xl font-black text-slate-900">{rub.val}%</span>
                       <div className="w-16 h-2 bg-slate-50 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{width: `${rub.val}%`}}></div>
                       </div>
                    </div>
                 </div>
               ))}
               {evalData.latestTestScore !== undefined && (
                 <div className="p-5 bg-blue-50 border border-blue-100 rounded-3xl shadow-sm space-y-2">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1"><GraduationCap size={12}/> Integrated Exam</p>
                    <div className="flex items-center justify-between">
                       <span className="text-2xl font-black text-blue-700">{evalData.latestTestScore}%</span>
                       <div className="w-16 h-2 bg-blue-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500" style={{width: `${evalData.latestTestScore}%`}}></div>
                       </div>
                    </div>
                 </div>
               )}
            </div>
          </div>

          {evalData.note && (
            <div className="p-8 bg-slate-900 rounded-[2rem] text-white space-y-3">
               <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={14} /> Evaluation Notes
               </h5>
               <p className="text-sm font-medium leading-relaxed italic text-slate-300">"{evalData.note}"</p>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Detail Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className={`p-4 rounded-2xl bg-${typeStyles[viewingRecord.type].color}-50 text-${typeStyles[viewingRecord.type].color}-600`}>
                       {React.createElement(typeStyles[viewingRecord.type].icon, { size: 28 })}
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{viewingRecord.title}</h3>
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase text-slate-400 tracking-widest">
                             {viewingRecord.date}
                          </span>
                       </div>
                       <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
                          <User size={14} className="text-slate-300" /> {viewingRecord.staffName}
                       </p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                      <Download size={16} /> Export
                    </button>
                    <button onClick={() => setViewingRecord(null)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
                      <X size={24} />
                    </button>
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                 {renderDetailContent()}
              </div>
              <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
                    <ShieldCheck size={14} /> Master Record System Verified Audit
                 </p>
              </div>
           </div>
        </div>
      )}

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
          <div className="grid grid-cols-4 gap-6">
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
            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase">Reports</p>
              <p className="text-2xl font-black">{monthlySnapshots.length}</p>
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
            <option value="Team Global">Team Global</option>
            {TEAM_MEMBERS.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto whitespace-nowrap">
            {(['all', 'performance', 'qa', 'exam', 'monthly_snapshot'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  filterType === type ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'
                }`}
              >
                {type === 'monthly_snapshot' ? 'Reports' : type}
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
              <div 
                key={r.id} 
                onClick={() => setViewingRecord(r)}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-8 group"
              >
                <div className="flex items-center gap-6">
                  <div className={`p-5 rounded-2xl bg-${style.color}-50 text-${style.color}-600 group-hover:bg-${style.color}-600 group-hover:text-white transition-all`}>
                    {React.createElement(style.icon, { size: 28 })}
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
                   <p className="text-sm text-slate-500 italic font-medium leading-relaxed max-w-lg truncate">
                     "{r.detail}"
                   </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                       {r.type === 'monthly_snapshot' ? 'Overall Score' : 'Audit Score'}
                    </p>
                    <div className="flex items-center gap-3">
                       <span className={`text-3xl font-black ${r.score >= 85 ? 'text-emerald-600' : r.score >= 70 ? 'text-blue-600' : 'text-rose-600'}`}>
                         {r.score}%
                       </span>
                       <div className="h-10 w-1 bg-slate-50 rounded-full overflow-hidden">
                          <div className={`w-full bg-${style.color}-500`} style={{height: `${r.score}%`}}></div>
                       </div>
                    </div>
                  </div>
                  <div className="p-3 text-slate-200 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-xl transition-all">
                    <ArrowRight size={20} />
                  </div>
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
                 Dashboard snapshots represent the finalized monthly state of all primary KPIs.
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

      {/* Danger Zone: System Clear */}
      <div className="pt-20 pb-10 flex justify-center border-t border-slate-100">
         <button 
           onClick={onClearAll}
           className="flex items-center gap-2 px-6 py-3 text-rose-300 hover:text-rose-600 transition-colors text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100"
         >
           <Trash2 size={14} /> System Reset Database (Test Mode)
         </button>
      </div>
    </div>
  );
};

export default MasterRecord;