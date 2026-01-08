import React, { useMemo, useState, useEffect } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Activity, 
  Zap, 
  Sparkles,
  Briefcase,
  Info,
  UserCheck
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationRecord, QARecord, TestSubmission } from '../types.ts';
import { TEAM_MEMBERS } from '../constants.tsx';

interface StaffHubProps {
  teamPerformance: { id: string, name: string, score: number }[];
  evaluations: EvaluationRecord[];
  qaRecords: QARecord[];
  testSubmissions: TestSubmission[];
}

const BUDDY_PAIRS: Record<string, string | null> = {
  'Pookie': 'Gam',
  'Gam': 'Pookie',
  'Namva': 'TBA 1',
  'TBA 1': 'Namva',
  'Aim': 'Noey',
  'Noey': 'Aim',
  'Pume': null
};

const StaffHub: React.FC<StaffHubProps> = ({ teamPerformance, evaluations, qaRecords, testSubmissions }) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Record<string, string>>({});
  const [workloadReasoning, setWorkloadReasoning] = useState<Record<string, string>>({});
  const [shoutout, setShoutout] = useState<string>("กำลังประมวลผลคำชมเชยประจำสัปดาห์...");

  const workloadData = useMemo(() => {
    return TEAM_MEMBERS.map(m => {
      const staffEvals = evaluations.filter(e => e.staffId === m.id);
      const totalIncoming = staffEvals.reduce((a, b) => a + (b.incomingCalls || 0), 0);
      const totalOutgoing = staffEvals.reduce((a, b) => a + (b.outgoingCalls || 0), 0);
      const totalChats = staffEvals.reduce((a, b) => a + (b.totalChats || 0), 0);
      const totalTasks = staffEvals.reduce((a, b) => a + (b.totalTasks || 0), 0);
      const weightedScore = (totalIncoming + totalOutgoing) * 5 + (totalChats * 2) + (totalTasks * 3);
      return {
        id: m.id, name: m.name, totalIncoming, totalOutgoing, totalChats, totalTasks, weightedScore,
        calls: totalIncoming + totalOutgoing
      };
    });
  }, [evaluations]);

  const fetchInsights = async () => {
    if (teamPerformance.length === 0) {
      setShoutout("ยินดีต้อนรับสู่ระบบ Dashboard! เริ่มต้นบันทึกคะแนนเพื่อรับฟีดแบ็กจาก AI");
      return;
    }
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const perfPrompt = `
        Based on these performance scores (out of 100), give ONE short 5-word Thai recommendation for each staff member on what to focus on next.
        Data: ${JSON.stringify(teamPerformance)}
        Format as JSON object: { "StaffName": "Recommendation" }
      `;
      const perfResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: perfPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            additionalProperties: { type: Type.STRING }
          }
        }
      });
      setInsights(JSON.parse(perfResponse.text || '{}'));

      const shoutoutPrompt = `
        Generate a one-sentence inspiring Weekly Shoutout in THAI for the whole team based on their performance data: ${JSON.stringify(teamPerformance)}.
        Highlight high performers or general growth.
      `;
      const shoutoutResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: shoutoutPrompt
      });
      setShoutout(shoutoutResponse.text || "ยอดเยี่ยมมากทุกคน พัฒนาการดีขึ้นอย่างต่อเนื่อง!");

      const workloadPrompt = `
        Analyze CS workload balance in THAI.
        Data: ${JSON.stringify(workloadData)}
        Format as JSON object: { "StaffName": "Brief Thai Explanation (max 15 words)" }
      `;
      const workloadResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: workloadPrompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            additionalProperties: { type: Type.STRING }
          }
        }
      });
      setWorkloadReasoning(JSON.parse(workloadResponse.text || '{}'));
    } catch (e) {
      console.error("AI Insight Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [workloadData, teamPerformance]);

  const renderWorkloadItem = (data: typeof workloadData[0]) => {
    const buddyName = BUDDY_PAIRS[data.name];
    let status = 'Balanced';
    if (buddyName) {
      const buddyData = workloadData.find(d => d.name === buddyName);
      if (buddyData) {
        const diff = data.weightedScore - buddyData.weightedScore;
        const threshold = Math.max(data.weightedScore, buddyData.weightedScore) * 0.15;
        status = diff > threshold ? 'Higher' : diff < -threshold ? 'Lower' : 'Balanced';
      }
    }
    return (
      <div key={data.id} className="p-6 bg-white/5 rounded-[2rem] border border-white/5 group hover:bg-white/10 transition-colors space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-black text-white text-base">{data.name}</p>
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">Status Report</p>
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${status === 'Higher' ? 'bg-rose-500 text-white' : status === 'Lower' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {status}
          </div>
        </div>
        <div className="flex items-start gap-2 bg-black/20 p-3 rounded-xl">
          <p className="text-[10px] text-blue-100/70 italic leading-relaxed">
            {workloadReasoning[data.name] || 'Calculating...'}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] p-12 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-white/20 rounded-[2rem] border border-white/20"><Sparkles size={40} /></div>
            <div>
              <h2 className="text-4xl font-black tracking-tight">Public Team Performance Hub</h2>
              <p className="text-blue-100 text-lg mt-1 font-medium opacity-80">Real-time stats for the entire Customer Support team</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3"><Trophy size={24} className="text-blue-600" /> Current Rankings</h3>
            <div className="space-y-4">
              {teamPerformance.map((member, index) => (
                <div key={member.id} className="p-6 bg-slate-50/50 rounded-[2.5rem] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 font-black">#{index + 1}</span>
                    <div>
                      <p className="font-black text-slate-800">{member.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{insights[member.name] || '...'}</p>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-slate-800">{member.score}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl space-y-8">
            <h3 className="text-xl font-black flex items-center gap-4"><UserCheck size={24} className="text-blue-400" /> Workload Summary</h3>
            <div className="space-y-6">
              {workloadData.map(data => renderWorkloadItem(data))}
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
             <div className="flex items-center gap-3">
               <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Zap size={24} /></div>
               <h3 className="text-xl font-black text-slate-800 tracking-tight">Manager's Shoutout</h3>
             </div>
             <div className="bg-amber-50/50 p-8 rounded-[2rem] border border-amber-100 italic font-bold text-slate-700 leading-relaxed text-sm">
                "{shoutout}"
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffHub;