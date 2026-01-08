import React, { useMemo, useState, useEffect } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import { EvaluationRecord, ProofRecord, PeerReviewRecord, TestSubmission } from '../types.ts';
import { TEAM_MEMBERS } from '../constants.tsx';
import { 
  Target, Activity, HeartHandshake, Camera, Clock, MessageCircle, ShieldCheck, Rocket, Zap, GraduationCap, FileCheck, Lock, KeyRound, AlertCircle, CheckCircle2
} from 'lucide-react';

interface IndividualDeepDiveProps {
  staffId: string;
  evaluations: EvaluationRecord[];
  proofs: ProofRecord[];
  peerReviews: PeerReviewRecord[];
  submissions: TestSubmission[];
  onStaffChange: (id: string) => void;
  mode?: 'manager' | 'public';
}

const IndividualDeepDive: React.FC<IndividualDeepDiveProps> = ({ staffId, evaluations, proofs, peerReviews, submissions, onStaffChange, mode = 'manager' }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  const staff = TEAM_MEMBERS.find(m => m.id === staffId);
  const memberEvals = evaluations.filter(e => e.staffId === staffId);
  const memberProofs = proofs.filter(p => p.staffId === staffId);
  const memberPeerReviews = peerReviews.filter(r => r.targetStaffId === staffId);
  const memberSubmissions = submissions.filter(s => s.staffName === staff?.name && s.isGraded);

  // Reset lock when switching staff
  useEffect(() => {
    setIsUnlocked(false);
    setPinInput('');
  }, [staffId]);

  const latestEval = useMemo(() => {
    return memberEvals.length > 0 ? memberEvals[memberEvals.length - 1] : null;
  }, [memberEvals]);

  const radarData = useMemo(() => {
    if (memberEvals.length === 0) return [];
    const count = memberEvals.length;
    return [
      { subject: 'Comm', A: Math.round(memberEvals.reduce((a, b) => a + b.communicationScore, 0) / count) },
      { subject: 'Speed', A: Math.round(memberEvals.reduce((a, b) => a + b.speedScore, 0) / count) },
      { subject: 'FollowUp', A: Math.round(memberEvals.reduce((a, b) => a + b.followUpScore, 0) / count) },
      { subject: 'Clarity', A: Math.round(memberEvals.reduce((a, b) => a + b.clarityScore, 0) / count) },
      { subject: 'Process', A: Math.round(memberEvals.reduce((a, b) => a + b.processCompliance, 0) / count) },
      { subject: 'Quality', A: Math.round(memberEvals.reduce((a, b) => a + b.onboardingQuality, 0) / count) },
    ];
  }, [memberEvals]);

  const overallIndividualScore = useMemo(() => {
    if (memberEvals.length === 0) return 0;
    const allScores = memberEvals.map(e => (e.communicationScore + e.speedScore + e.followUpScore + e.clarityScore + e.processCompliance + e.onboardingQuality) / 6);
    return Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length);
  }, [memberEvals]);

  const peerReviewAvg = useMemo(() => {
    if (memberPeerReviews.length === 0) return 0;
    const sum = memberPeerReviews.reduce((acc, curr) => acc + (curr.teamworkScore + curr.helpfulnessScore + curr.communicationScore) / 3, 0);
    return Math.round(sum / memberPeerReviews.length);
  }, [memberPeerReviews]);

  const handleUnlock = () => {
    if (staff && pinInput === staff.passcode) {
      setIsUnlocked(true);
      setPinInput('');
    } else {
      alert("PIN ไม่ถูกต้อง! กรุณาลองใหม่");
      setPinInput('');
    }
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-32">
      {/* Header Section */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center text-3xl font-black">
            {staff?.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
             <div className="flex items-center gap-3">
               <h2 className="text-4xl font-black text-slate-800">{staff?.name}</h2>
               <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">{staff?.role}</span>
             </div>
             <p className="text-slate-400 font-bold text-sm mt-2">Overall Performance Index: <span className="text-slate-800 font-black">{overallIndividualScore}%</span></p>
          </div>
        </div>
        {mode === 'manager' && (
          <select className="bg-slate-100 p-4 rounded-2xl font-black outline-none cursor-pointer hover:bg-slate-200 transition-colors" value={staffId} onChange={(e) => onStaffChange(e.target.value)}>
            {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        )}
      </div>

      {/* Quantitative Efficiency Section - Publicly Visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-4">
            <div className="flex items-center justify-between">
               <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Project SLA Contribution</p>
               <ShieldCheck size={20} className="text-indigo-400" />
            </div>
            <h4 className="text-5xl font-black tracking-tighter">
               {latestEval?.slaMetCount || 0}<span className="text-indigo-400 text-2xl font-black ml-1">/ {latestEval?.slaTotalBase || 0}</span>
            </h4>
            <p className="text-xs text-slate-400 font-medium italic">Efficiency: {latestEval?.individualSlaPct || 0}% contribution to global total.</p>
         </div>
         <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white space-y-4">
            <div className="flex items-center justify-between">
               <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Avg Response Speed</p>
               <Clock size={20} className="text-blue-200" />
            </div>
            <h4 className="text-5xl font-black tracking-tighter">{latestEval?.responseTimeMin || 0}<span className="text-blue-200 text-2xl font-black ml-1">min</span></h4>
            <p className="text-xs text-blue-100 font-medium">Lower is better. Reflects daily efficiency.</p>
         </div>
         <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project count</p>
               <Rocket size={20} className="text-blue-600" />
            </div>
            <h4 className="text-5xl font-black tracking-tighter text-slate-900">{latestEval?.projectCount || 0}</h4>
            <p className="text-xs text-slate-400 font-medium">Total systems activated (Active logs).</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Competency Radar - Publicly Visible */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="font-black text-xl text-slate-800 mb-8 flex items-center gap-2"><Target className="text-blue-500" /> Competency Radar</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#f1f5f9" />
                <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                <Radar dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manager-only Views: Peer Feedback & Proof Overview */}
        {mode === 'manager' && (
          <>
            <div className="bg-indigo-900 p-10 rounded-[3rem] text-white shadow-xl flex flex-col justify-between">
               <div>
                  <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">360° Peer Feedback</p>
                  <h3 className="text-3xl font-black leading-tight">Team Perception</h3>
               </div>
               <div className="flex items-center gap-6">
                  <div className="text-6xl font-black">{peerReviewAvg}%</div>
                  <div className="flex-1 space-y-2">
                     <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-400" style={{width: `${peerReviewAvg}%`}}></div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
               <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Camera size={20} /></div>
                    <h3 className="text-xl font-black text-slate-800">Proof History</h3>
                  </div>
               </div>
               <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-3xl font-black text-slate-800">{memberProofs.length}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Internal Records</span>
               </div>
            </div>
          </>
        )}

        {/* Public Personal Data Section: Protected by PIN */}
        {mode === 'public' && (
          <div className="lg:col-span-2 space-y-8">
            {!isUnlocked ? (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-900 rounded-[3rem] border border-slate-800 shadow-2xl text-center">
                <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl mb-6">
                   <KeyRound size={40} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">Personal Data Vault</h3>
                <p className="text-slate-400 font-bold mb-8 text-sm max-w-xs">กรุณาใส่รหัสผ่าน 4 หลักของคุณเพื่อดู "ประวัติการสอบ" และ "Proof History" ส่วนตัว</p>
                <div className="flex gap-3">
                  <input 
                    type="password" 
                    maxLength={4} 
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                    placeholder="PIN"
                    className="w-40 text-center bg-white/5 border border-white/10 p-5 rounded-2xl font-black text-2xl text-white outline-none focus:border-blue-500 transition-all shadow-inner"
                  />
                  <button onClick={handleUnlock} className="p-5 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 active:scale-95 transition-all">
                    <Zap size={24} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-500">
                {/* 1. Unlocked Exam History */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                   <div className="flex items-center gap-3 mb-8">
                     <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><GraduationCap size={20} /></div>
                     <h3 className="text-xl font-black text-slate-800">Exam Results</h3>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 max-h-[400px] pr-2">
                      {memberSubmissions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3 opacity-50 py-10">
                           <FileCheck size={48} />
                           <p className="text-[10px] font-black uppercase tracking-widest">No Graded Exams</p>
                        </div>
                      ) : (
                        memberSubmissions.map(sub => {
                          const scorePct = Math.round(((sub.autoScore + sub.manualScore) / sub.totalPossiblePoints) * 100);
                          return (
                            <div key={sub.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-emerald-200 transition-colors">
                               <div className="space-y-1">
                                  <p className="font-black text-slate-800 text-sm line-clamp-1">{sub.testTitle}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">{sub.date}</p>
                               </div>
                               <div className="text-right">
                                  <p className="text-xl font-black text-blue-600">{scorePct}%</p>
                               </div>
                            </div>
                          );
                        })
                      )}
                   </div>
                </div>

                {/* 2. Unlocked Proof History */}
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
                   <div className="flex items-center gap-3 mb-8">
                     <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Camera size={20} /></div>
                     <h3 className="text-xl font-black text-slate-800">Proof History</h3>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 max-h-[400px] pr-2">
                      {memberProofs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3 opacity-50 py-10">
                           <Activity size={48} />
                           <p className="text-[10px] font-black uppercase tracking-widest">No Internal Proofs</p>
                        </div>
                      ) : (
                        memberProofs.map(proof => (
                          <div key={proof.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                             <div className="flex justify-between items-center">
                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${proof.category === 'Positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                   {proof.category}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">{proof.date}</span>
                             </div>
                             <p className="text-xs font-medium text-slate-600 italic">"{proof.description}"</p>
                          </div>
                        ))
                      )}
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* If manager mode, show Exam History without PIN (Existing logic) */}
        {mode === 'manager' && (
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col">
             <div className="flex items-center gap-3 mb-8">
               <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><GraduationCap size={20} /></div>
               <h3 className="text-xl font-black text-slate-800">Accuracy History</h3>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {memberSubmissions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3 opacity-50 py-10">
                     <FileCheck size={48} />
                     <p className="text-[10px] font-black uppercase tracking-widest">No Graded Exams</p>
                  </div>
                ) : (
                  memberSubmissions.map(sub => {
                    const scorePct = Math.round(((sub.autoScore + sub.manualScore) / sub.totalPossiblePoints) * 100);
                    return (
                      <div key={sub.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                         <div className="space-y-1">
                            <p className="font-black text-slate-800 text-sm line-clamp-1">{sub.testTitle}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{sub.date}</p>
                         </div>
                         <p className={`text-xl font-black ${scorePct >= 80 ? 'text-emerald-600' : 'text-blue-600'}`}>{scorePct}%</p>
                      </div>
                    );
                  })
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualDeepDive;