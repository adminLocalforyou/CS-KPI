
import React, { useState, useMemo } from 'react';
import { 
  HeartHandshake, 
  Send, 
  ExternalLink, 
  User, 
  Star, 
  MessageCircle, 
  Clock,
  ShieldCheck,
  Zap,
  ChevronRight,
  Target,
  Check,
  ArrowRight
} from 'lucide-react';
import { TEAM_MEMBERS } from '../constants.tsx';
import { PeerReviewRecord } from '../types.ts';

interface PeerReviewCollectorProps {
  onReceiveReview: (record: PeerReviewRecord) => void;
  forceShowForm?: boolean;
  reviews: PeerReviewRecord[];
}

const PeerReviewCollector: React.FC<PeerReviewCollectorProps> = ({ onReceiveReview, forceShowForm = false, reviews }) => {
  const [showForm, setShowForm] = useState(forceShowForm);
  const [copied, setCopied] = useState(false);
  
  // Internal Form State
  const [targetStaffId, setTargetStaffId] = useState(TEAM_MEMBERS[0].id);
  const [reviewerName, setReviewerName] = useState('');
  const [scores, setScores] = useState({ teamwork: 5, helpfulness: 5, communication: 5 });
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) {
      alert("Please provide a comment for your colleague.");
      return;
    }

    const newReview: PeerReviewRecord = {
      id: Date.now().toString(),
      targetStaffId,
      reviewerName: reviewerName.trim() || 'Anonymous',
      date: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      timestamp: new Date().toISOString(),
      teamworkScore: scores.teamwork,
      helpfulnessScore: scores.helpfulness,
      communicationScore: scores.communication,
      comment
    };

    onReceiveReview(newReview);
    if (!forceShowForm) {
      setShowForm(false);
    }
    setReviewerName('');
    setComment('');
    setScores({ teamwork: 5, helpfulness: 5, communication: 5 });
  };

  const copyLink = () => {
    const baseUrl = window.location.href.split('#')[0].split('?')[0];
    const examLink = `${baseUrl}#peer-review`;
    
    navigator.clipboard.writeText(examLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert(`คัดลอกลิ้งค์สำหรับพนักงานแล้ว: ${examLink}`);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert("Review Link: " + examLink);
    });
  };

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-[3.5rem] p-12 shadow-2xl animate-in zoom-in-95 duration-300">
        {!forceShowForm && (
          <button onClick={() => setShowForm(false)} className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-10 hover:text-slate-900 transition-all flex items-center gap-2">← Back to Dashboard</button>
        )}
        
        <div className="space-y-10">
          <div className="text-center space-y-2">
             <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] text-white flex items-center justify-center mx-auto shadow-xl mb-6"><HeartHandshake size={40} /></div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">360° Peer Review</h2>
             <p className="text-slate-400 font-bold italic">ช่วยให้เพื่อนร่วมทีมของคุณเติบโตไปด้วยกัน</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">คุณต้องการประเมินใคร?</label>
                 <select 
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-800 outline-none"
                   value={targetStaffId}
                   onChange={(e) => setTargetStaffId(e.target.value)}
                 >
                   {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ชื่อผู้ประเมิน (Optional / Anonymous)</label>
                 <input 
                   type="text" 
                   className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-black text-slate-800 outline-none"
                   placeholder="เว้นว่างไว้หากต้องการประเมินแบบไม่ระบุตัวตน..."
                   value={reviewerName}
                   onChange={(e) => setReviewerName(e.target.value)}
                 />
              </div>
            </div>

            <div className="space-y-10">
               <RatingSlider label="Teamwork / การทำงานเป็นทีม" value={scores.teamwork} onChange={(v) => setScores({...scores, teamwork: v})} />
               <RatingSlider label="Helpfulness / ความช่วยเหลือ" value={scores.helpfulness} onChange={(v) => setScores({...scores, helpfulness: v})} />
               <RatingSlider label="Communication / การสื่อสาร" value={scores.communication} onChange={(v) => setScores({...scores, communication: v})} />
            </div>

            <div className="space-y-3">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ข้อความถึงเพื่อน (ชมเชยหรือข้อควรพัฒนา)</label>
               <textarea 
                 rows={4}
                 className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 font-medium text-slate-700 outline-none shadow-sm focus:bg-white focus:border-indigo-500 transition-all"
                 placeholder="เขียนความประทับใจหรือสิ่งที่อยากให้เพื่อนปรับปรุง..."
                 value={comment}
                 onChange={(e) => setComment(e.target.value)}
               />
            </div>

            <button type="submit" className="w-full py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all">
              <Send size={24} /> Submit Feedback
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12"><ShieldCheck size={200} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 space-y-6">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg"><Zap size={24} /></div>
                <h2 className="text-3xl font-black tracking-tight">Bi-Monthly Review Controller</h2>
             </div>
             <p className="text-slate-400 font-medium leading-relaxed max-w-lg">
                ระบบรวบรวมฟีดแบ็กจากเพื่อนร่วมทีม ข้อมูลนี้จะถูกเก็บไว้ในหน้า Deep Dive เพื่อช่วยให้พวกเขาเห็นมุมมองจากคนรอบข้าง
             </p>
             <div className="flex gap-4">
               <button 
                onClick={copyLink}
                className={`px-8 py-4 font-black rounded-2xl shadow-xl transition-all flex items-center gap-3 ${
                  copied ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900 hover:bg-slate-50'
                }`}
               >
                 {copied ? <Check size={20} /> : <ExternalLink size={20} />} 
                 {copied ? 'Link Copied!' : 'Copy Review Link'}
               </button>
               <button 
                onClick={() => setShowForm(true)}
                className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl hover:bg-indigo-500 transition-all flex items-center gap-3"
               >
                 <ChevronRight size={20} /> Preview Form (Sim)
               </button>
             </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] space-y-4 text-center">
             <div className="flex items-center justify-center gap-3">
                <Clock size={16} className="text-indigo-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Feedback Received</span>
             </div>
             <p className="text-5xl font-black">{reviews.length}</p>
             <div className="flex items-center justify-center gap-2 text-emerald-400">
                <ShieldCheck size={14} />
                <span className="text-[10px] font-black uppercase">Collection Active</span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
         <div className="space-y-4">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto"><Target size={24} /></div>
            <h5 className="font-black text-slate-800">Identify Blindspots</h5>
            <p className="text-xs text-slate-400 font-medium">ช่วยให้ Manager มองเห็นปัญหาที่เกิดขึ้นภายในทีมที่อาจจะไม่ได้อยู่ใน KPI หลัก</p>
         </div>
         <div className="space-y-4">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto"><Star size={24} /></div>
            <h5 className="font-black text-slate-800">Reward Soft Skills</h5>
            <p className="text-xs text-slate-400 font-medium">เพื่อนร่วมทีมจะบอกได้ดีที่สุดว่าใครคือคนที่ช่วยเหลือคนอื่นมากที่สุด</p>
         </div>
         <div className="space-y-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto"><MessageCircle size={24} /></div>
            <h5 className="font-black text-slate-800">Continuous Growth</h5>
            <p className="text-xs text-slate-400 font-medium">รอบการประเมินทุก 2 เดือนเพื่อให้แน่ใจว่าการปรับตัวเป็นไปอย่างต่อเนื่อง</p>
         </div>
      </div>

      {/* NEW: Feedback Summary Section for Manager Scan */}
      <div className="space-y-8 pb-10">
        <div className="flex items-center justify-between px-6">
           <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
             <MessageCircle className="text-indigo-600" /> Recent Feedback Stream
           </h3>
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full">
             Real-time Monitoring
           </span>
        </div>

        {reviews.length === 0 ? (
          <div className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-20 text-center space-y-4">
             <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto"><HeartHandshake size={40} /></div>
             <p className="text-slate-300 font-black uppercase tracking-widest">No Feedback Collected Yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.slice(0, 10).map((r) => {
              const targetStaff = TEAM_MEMBERS.find(m => m.id === r.targetStaffId);
              const avg = Math.round(((r.teamworkScore + r.helpfulnessScore + r.communicationScore) / 15) * 100);
              
              return (
                <div key={r.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all space-y-6 group">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-xs">
                            {targetStaff?.name.substring(0, 2).toUpperCase()}
                         </div>
                         <div>
                            <p className="font-black text-slate-800">{targetStaff?.name}</p>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                               <Clock size={10} /> {r.date}
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Impact Score</p>
                         <div className={`text-2xl font-black ${avg >= 80 ? 'text-emerald-500' : 'text-indigo-600'}`}>{avg}%</div>
                      </div>
                   </div>

                   <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 relative">
                      <MessageCircle className="absolute -top-3 -left-3 text-indigo-200" size={32} />
                      <p className="text-sm font-bold text-slate-600 italic leading-relaxed">
                        "{r.comment}"
                      </p>
                   </div>

                   <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                      <div className="flex gap-3">
                         <div className="text-center">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Team</p>
                            <p className="text-xs font-black text-slate-700">{r.teamworkScore}/5</p>
                         </div>
                         <div className="text-center border-l border-slate-200 pl-3">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Help</p>
                            <p className="text-xs font-black text-slate-700">{r.helpfulnessScore}/5</p>
                         </div>
                         <div className="text-center border-l border-slate-200 pl-3">
                            <p className="text-[8px] font-black text-slate-400 uppercase">Comm</p>
                            <p className="text-xs font-black text-slate-700">{r.communicationScore}/5</p>
                         </div>
                      </div>
                      <div className="text-[9px] font-black text-slate-300 uppercase italic">
                         By: {r.reviewerName}
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const RatingSlider: React.FC<{ label: string, value: number, onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-4">
     <div className="flex justify-between items-center">
        <label className="text-xs font-black text-slate-800 uppercase tracking-widest">{label}</label>
        <span className="text-xl font-black text-indigo-600">{value}/5</span>
     </div>
     <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`flex-1 h-12 rounded-xl border-2 transition-all font-black text-lg ${
              value === s ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'
            }`}
          >
            {s}
          </button>
        ))}
     </div>
  </div>
);

export default PeerReviewCollector;
