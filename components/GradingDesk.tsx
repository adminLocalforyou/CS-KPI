import React, { useState } from 'react';
import { 
  PenTool, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ChevronRight,
  User,
  Save,
  MessageSquare,
  Award
} from 'lucide-react';
import { TestSubmission, AssessmentRecord } from '../types.ts';

interface GradingDeskProps {
  submissions: TestSubmission[];
  assessments: AssessmentRecord[];
  onUpdate: (submission: TestSubmission) => void;
}

const GradingDesk: React.FC<GradingDeskProps> = ({ submissions, assessments, onUpdate }) => {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [gradingValues, setGradingValues] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');

  const pendingSubmissions = submissions.filter(s => !s.isGraded);
  const selectedSubmission = submissions.find(s => s.id === selectedSubmissionId);
  const test = assessments.find(a => a.id === selectedSubmission?.testId);

  const handleGrade = (qId: string, score: number) => {
    setGradingValues(prev => ({ ...prev, [qId]: score }));
  };

  const handleFinalize = () => {
    if (!selectedSubmission) return;

    const manualScore = Object.values(gradingValues).reduce((a, b) => a + b, 0);
    const updated: TestSubmission = {
      ...selectedSubmission,
      manualScore,
      managerFeedback: feedback,
      isGraded: true
    };

    onUpdate(updated);
    setSelectedSubmissionId(null);
    setGradingValues({});
    setFeedback('');
    alert("Grading complete! Results are now visible to the team.");
  };

  if (selectedSubmissionId && selectedSubmission && test) {
    const writtenQuestions = test.questions.filter(q => q.type === 'written');
    
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <button onClick={() => setSelectedSubmissionId(null)} className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">← Back to Inbox</button>
        
        <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-12">
           <div className="flex items-center justify-between border-b border-slate-50 pb-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center text-xl font-black">
                    {selectedSubmission.staffName.substring(0,2).toUpperCase()}
                 </div>
                 <div>
                    <h3 className="text-2xl font-black text-slate-900">{selectedSubmission.staffName}</h3>
                    <p className="text-xs text-slate-400 font-bold">{test.title} • {selectedSubmission.date}</p>
                 </div>
              </div>
              <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Auto Score (Choice)</p>
                 <p className="text-2xl font-black text-emerald-700">{selectedSubmission.autoScore}/{selectedSubmission.totalPossiblePoints}</p>
              </div>
           </div>

           <div className="space-y-12">
              {writtenQuestions.map((q, i) => (
                <div key={q.id} className="space-y-6">
                   <div className="flex justify-between items-center">
                      <h4 className="text-lg font-black text-slate-800">Question {i+1}: {q.question}</h4>
                      <span className="text-[10px] font-black text-slate-400 uppercase">Max Points: {q.maxPoints}</span>
                   </div>
                   <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 font-bold text-slate-700 leading-relaxed italic">
                      "{selectedSubmission.answers[q.id] || '(No Answer Provided)'}"
                   </div>
                   <div className="flex items-center gap-4 px-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supervisor Score:</span>
                      <div className="flex gap-2">
                         {Array.from({length: q.maxPoints + 1}).map((_, score) => (
                           <button 
                             key={score} 
                             onClick={() => handleGrade(q.id, score)}
                             className={`w-10 h-10 rounded-xl font-black transition-all border-2 ${gradingValues[q.id] === score ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-300'}`}
                           >
                             {score}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              ))}
           </div>

           <div className="space-y-4 pt-10 border-t border-slate-50">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={14}/> Manager Feedback</label>
              <textarea 
                rows={3} 
                className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
                placeholder="Give constructive feedback for this staff member..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />
           </div>

           <button onClick={handleFinalize} className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-4 active:scale-95">
              <Save size={24} /> Submit Final Grades & Notify Staff
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><PenTool size={200} /></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-emerald-600 rounded-[2rem] shadow-lg shadow-emerald-500/30"><PenTool size={40} /></div>
            <div>
              <h2 className="text-4xl font-black tracking-tight">Grading Desk</h2>
              <p className="text-slate-400 text-lg mt-1 font-medium italic">Supervisor workspace for marking written exams</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 flex items-center gap-8 min-w-[200px]">
            <div className="text-right">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Pending Audit</p>
              <p className="text-5xl font-black tracking-tighter">{pendingSubmissions.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
         {pendingSubmissions.length === 0 ? (
           <div className="py-20 bg-white rounded-[3.5rem] border border-slate-100 flex flex-col items-center justify-center text-slate-300 space-y-4">
              <CheckCircle2 size={64} className="text-emerald-100" />
              <p className="font-black uppercase tracking-[0.2em]">Inbox Empty • Everything Graded</p>
           </div>
         ) : (
           pendingSubmissions.map((s) => (
             <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between gap-6 group hover:border-indigo-200 transition-all">
                <div className="flex items-center gap-6">
                   <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-lg font-black shadow-lg">
                      {s.staffName.substring(0,2).toUpperCase()}
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-slate-900">{s.staffName}</h4>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{s.testTitle} • {s.date}</p>
                   </div>
                </div>
                <div className="flex items-center gap-10">
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Wait Status</p>
                      <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                         <Clock size={14} /> Pending Essay
                      </div>
                   </div>
                   <button onClick={() => setSelectedSubmissionId(s.id)} className="px-6 py-4 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                      Start Grading <ChevronRight size={16} />
                   </button>
                </div>
             </div>
           ))
         )}
      </div>

      {submissions.filter(s => s.isGraded).length > 0 && (
        <div className="pt-10 space-y-6">
           <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Recently Finalized</h4>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {submissions.filter(s => s.isGraded).slice(0, 4).map(s => (
                <div key={s.id} className="p-6 bg-white rounded-3xl border border-slate-50 flex items-center justify-between opacity-60">
                   <div className="flex items-center gap-4">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={16} /></div>
                      <div>
                         <p className="font-black text-slate-800 text-sm">{s.staffName}</p>
                         <p className="text-[10px] text-slate-400 font-bold">{s.testTitle}</p>
                      </div>
                   </div>
                   <div className="text-xl font-black text-slate-800">{Math.round(((s.autoScore + s.manualScore) / s.totalPossiblePoints) * 100)}%</div>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default GradingDesk;