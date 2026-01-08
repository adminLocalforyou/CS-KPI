import React, { useState, useMemo } from 'react';
import { 
  Award, 
  Search, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  X, 
  ArrowRight,
  Target,
  BookOpen,
  User,
  Shield,
  FileText,
  Info
} from 'lucide-react';
import { AssessmentRecord, TestSubmission } from '../types.ts';

interface PublicAnswersProps {
  assessments: AssessmentRecord[];
  submissions: TestSubmission[];
}

const PublicAnswers: React.FC<PublicAnswersProps> = ({ assessments, submissions }) => {
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('all');
  const [viewingSubmissionId, setViewingSubmissionId] = useState<string | null>(null);

  // Filter only submissions that have been finalized/graded by the supervisor
  const gradedSubmissions = useMemo(() => {
    return submissions.filter(s => s.isGraded);
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    if (selectedAssessmentId === 'all') return gradedSubmissions;
    return gradedSubmissions.filter(s => s.testId === selectedAssessmentId);
  }, [gradedSubmissions, selectedAssessmentId]);

  const viewingSubmission = useMemo(() => {
    return submissions.find(s => s.id === viewingSubmissionId);
  }, [submissions, viewingSubmissionId]);

  const activeAssessment = useMemo(() => {
    return assessments.find(a => a.id === viewingSubmission?.testId);
  }, [assessments, viewingSubmission]);

  // Anonymization Map: Map real names to "Anonymous X" labels
  const anonymizedMap = useMemo(() => {
    const map: Record<string, string> = {};
    let counter = 1;
    gradedSubmissions.forEach(s => {
      if (!map[s.staffName]) {
        map[s.staffName] = `Anonymous ${String.fromCharCode(64 + counter)}`;
        counter++;
      }
    });
    return map;
  }, [gradedSubmissions]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Detail View Modal: Shows the comparison */}
      {viewingSubmission && activeAssessment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
              <div className="p-10 border-b border-slate-50 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="p-4 rounded-2xl bg-blue-50 text-blue-600">
                       <Award size={28} />
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{activeAssessment.title}</h3>
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                             {viewingSubmission.date}
                          </span>
                       </div>
                       <p className="text-sm font-bold text-slate-500 flex items-center gap-2 mt-1">
                          <Shield size={14} className="text-slate-300" /> {anonymizedMap[viewingSubmission.staffName] || 'Anonymous User'} • Final Score: {Math.round(((viewingSubmission.autoScore + viewingSubmission.manualScore) / viewingSubmission.totalPossiblePoints) * 100)}%
                       </p>
                    </div>
                 </div>
                 <button onClick={() => setViewingSubmissionId(null)} className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
                    <X size={24} />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Points</p>
                       <p className="text-2xl font-black text-slate-800">{viewingSubmission.autoScore + viewingSubmission.manualScore} / {viewingSubmission.totalPossiblePoints}</p>
                    </div>
                    <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 md:col-span-2">
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Learning Tip</p>
                       <p className="text-sm font-bold text-blue-800 italic">"ลองเปรียบเทียบคำตอบของเพื่อนกับเฉลยสีน้ำเงินเข้มเพื่อพัฒนาความเข้าใจใน SOP ครับ"</p>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Answer Key Comparison</h5>
                    {activeAssessment.questions.map((q, idx) => {
                       const staffAnswer = viewingSubmission.answers[q.id];
                       const isCorrect = q.type === 'choice' ? staffAnswer === q.correctAnswer : true;

                       return (
                          <div key={q.id} className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 space-y-4">
                             <div className="flex justify-between items-start gap-4">
                                <div className="flex items-center gap-4">
                                   <span className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-black text-xs text-slate-400 border border-slate-100">{idx + 1}</span>
                                   <p className="font-bold text-slate-800">{q.question}</p>
                                </div>
                                {q.type === 'choice' && (
                                   isCorrect ? <CheckCircle2 className="text-emerald-500" size={24} /> : <AlertCircle className="text-rose-500" size={24} />
                                )}
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div className="space-y-2">
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                      <User size={10}/> พนักงานตอบ
                                   </p>
                                   <div className={`p-4 rounded-2xl text-sm font-bold ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                      {staffAnswer || '(ไม่ได้ระบุคำตอบ)'}
                                   </div>
                                </div>
                                {q.type === 'choice' && (
                                   <div className="space-y-2">
                                      <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                                         <Shield size={10}/> คำตอบที่ถูกต้อง (เฉลย)
                                      </p>
                                      <div className="p-4 bg-slate-900 rounded-2xl text-sm font-black text-white shadow-lg">
                                         {q.correctAnswer}
                                      </div>
                                   </div>
                                )}
                             </div>
                          </div>
                       );
                    })}
                 </div>

                 {viewingSubmission.managerFeedback && (
                    <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-4">
                       <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500"><BookOpen size={20} /></div>
                       <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Supervisor's Conclusion</p>
                          <p className="text-sm font-bold text-amber-900 italic">"{viewingSubmission.managerFeedback}"</p>
                       </div>
                    </div>
                 )}
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                 <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2">
                    <Shield size={14} /> ระบบเฉลยข้อสอบเพื่อการเรียนรู้ (Anonymized Mode)
                 </p>
              </div>
           </div>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-blue-600 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12"><BookOpen size={240} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-white/20 rounded-[2rem] border border-white/20"><Award size={40} /></div>
            <div>
              <h2 className="text-4xl font-black tracking-tight">Exam Review & Answer Keys</h2>
              <p className="text-blue-100 text-lg mt-1 font-medium italic">เฉลยข้อสอบเพื่อให้ทุกคนเรียนรู้ร่วมกัน (ข้อมูลนิรนาม)</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center min-w-[200px]">
             <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Graded Exams</p>
             <p className="text-5xl font-black tracking-tighter">{gradedSubmissions.length}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 items-center">
         <div className="flex-1 w-full relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
               type="text" 
               placeholder="Search exam title..." 
               className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-800 outline-none focus:border-blue-500"
            />
         </div>
         <select 
            className="w-full md:w-64 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-black text-slate-800 outline-none cursor-pointer"
            value={selectedAssessmentId}
            onChange={(e) => setSelectedAssessmentId(e.target.value)}
         >
            <option value="all">All Assessments</option>
            {assessments.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
         </select>
      </div>

      {/* List Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredSubmissions.length === 0 ? (
            <div className="col-span-full py-20 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 space-y-4">
               <FileText size={64} />
               <p className="font-black uppercase tracking-widest">ยังไม่มีข้อสอบที่ตรวจเสร็จสมบูรณ์ในระบบ</p>
            </div>
         ) : (
            filteredSubmissions.map((s, idx) => (
               <div 
                  key={s.id} 
                  onClick={() => setViewingSubmissionId(s.id)}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group"
               >
                  <div className="flex items-center justify-between mb-6">
                     <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Results #{idx + 1}
                     </span>
                     <div className={`text-2xl font-black ${s.autoScore + s.manualScore >= (s.totalPossiblePoints * 0.8) ? 'text-emerald-500' : 'text-blue-500'}`}>
                        {Math.round(((s.autoScore + s.manualScore) / s.totalPossiblePoints) * 100)}%
                     </div>
                  </div>
                  <h4 className="text-xl font-black text-slate-800 leading-tight mb-2">{s.testTitle}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-bold mb-6">
                     <Calendar size={14} /> {s.date}
                  </div>
                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between group-hover:text-blue-600 transition-colors">
                     <span className="text-[10px] font-black uppercase tracking-widest">ดูเปรียบเทียบคำตอบ</span>
                     <ArrowRight size={18} />
                  </div>
               </div>
            ))
         )}
      </div>

      {/* Notice Card */}
      <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex items-start gap-6">
         <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-500"><Info size={24} /></div>
         <div className="space-y-1">
            <h5 className="font-black text-slate-800 text-sm uppercase">Privacy & Team Learning</h5>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
               หน้านี้มีไว้เพื่อการเรียนรู้ร่วมกัน ข้อมูลชื่อพนักงานจะถูกปิดบัง (Anonymous) เพื่อความเป็นส่วนตัว โดยจะเน้นไปที่การเปรียบเทียบคำตอบกับเฉลยที่ถูกต้อง เพื่อให้ทุกคนเข้าใจมาตรฐานงานที่ตรงกันครับ
            </p>
         </div>
      </div>
    </div>
  );
};

export default PublicAnswers;