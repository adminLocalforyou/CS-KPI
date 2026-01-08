import React, { useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer
} from 'recharts';
import { EvaluationRecord, ProofRecord, PeerReviewRecord } from '../types.ts';
import { TEAM_MEMBERS } from '../constants.tsx';
import { 
  Target, Activity, HeartHandshake, Camera, Clock, MessageCircle
} from 'lucide-react';

interface IndividualDeepDiveProps {
  staffId: string;
  evaluations: EvaluationRecord[];
  proofs: ProofRecord[];
  peerReviews: PeerReviewRecord[];
  onStaffChange: (id: string) => void;
}

const IndividualDeepDive: React.FC<IndividualDeepDiveProps> = ({ staffId, evaluations, proofs, peerReviews, onStaffChange }) => {
  const staff = TEAM_MEMBERS.find(m => m.id === staffId);
  const memberEvals = evaluations.filter(e => e.staffId === staffId);
  const memberProofs = proofs.filter(p => p.staffId === staffId);
  const memberPeerReviews = peerReviews.filter(r => r.targetStaffId === staffId);

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

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-32">
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
        <select className="bg-slate-100 p-4 rounded-2xl font-black outline-none" value={staffId} onChange={(e) => onStaffChange(e.target.value)}>
          {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
      </div>
    </div>
  );
};

export default IndividualDeepDive;