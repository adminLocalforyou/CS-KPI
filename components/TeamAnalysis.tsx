
import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  Zap, 
  Loader2,
  ChevronRight,
  Target,
  RefreshCcw,
  ShieldAlert,
  Key,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationRecord, QARecord } from '../types.ts';

// Fix: Use the global AIStudio type to avoid conflict with existing property declarations.
declare global {
  interface Window {
    aistudio?: AIStudio;
  }
}

interface PerformanceSummary {
  id: string;
  name: string;
  score: number;
}

interface TeamAnalysisProps {
  teamPerformance: PerformanceSummary[];
  evaluations: EvaluationRecord[];
  qaRecords: QARecord[];
}

interface AIAnalysisResult {
  teamGaps: string[];
  teamStrengths: string[];
  individualInsights: {
    staffName: string;
    gapArea: string;
    recommendation: string;
  }[];
}

const TeamAnalysis: React.FC<TeamAnalysisProps> = ({ teamPerformance, evaluations, qaRecords }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsKey, setNeedsKey] = useState(false);

  const hasEnoughData = evaluations.length > 0 || qaRecords.length > 0;

  const runAnalysis = async () => {
    if (!hasEnoughData) {
      setError("ไม่มีข้อมูลดิบ (Logs หรือ QA) เพียงพอสำหรับการวิเคราะห์ กรุณาบันทึกข้อมูลก่อนครับ");
      return;
    }

    setLoading(true);
    setError(null);
    setNeedsKey(false);

    try {
      // Defensive Check: ตรวจสอบ window.aistudio ก่อนเรียกใช้
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey && !process.env.API_KEY) {
          setNeedsKey(true);
          setLoading(false);
          return;
        }
      } else if (!process.env.API_KEY) {
        // กรณีไม่มี window.aistudio และไม่มี API_KEY ใน env
        setError("ไม่พบ API Key ในระบบ กรุณาตั้งค่า API Key เพื่อใช้งานส่วนการวิเคราะห์");
        setLoading(false);
        return;
      }

      // CRITICAL: Always create a new GoogleGenAI instance right before making an API call to ensure it uses the most up-to-date API key.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const teamContext = teamPerformance.map(p => {
        const staffEvals = evaluations.filter(e => e.staffId === p.id);
        const latestEval = staffEvals.length > 0 ? staffEvals[staffEvals.length - 1] : null;
        
        return {
          name: p.name,
          compositeScore: p.score,
          individualSla: latestEval?.individualSlaPct || 0,
          responseTime: latestEval?.responseTimeMin || 0,
          projectsDone: latestEval?.projectCount || 0,
          totalWorkload: (latestEval?.incomingCalls || 0) + (latestEval?.outgoingCalls || 0) + (latestEval?.totalChats || 0)
        };
      });

      const prompt = `
        Analyze this Customer Support team performance.
        Data Context: ${JSON.stringify(teamContext)}
        
        Guidelines:
        - Analyze workload vs score.
        - Flag bottlenecks (response time > 10 min).
        - Thai language output.
        - JSON format strictly.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 4000 },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              teamGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
              teamStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              individualInsights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    staffName: { type: Type.STRING },
                    gapArea: { type: Type.STRING },
                    recommendation: { type: Type.STRING }
                  },
                  required: ["staffName", "gapArea", "recommendation"]
                }
              }
            },
            required: ["teamGaps", "teamStrengths", "individualInsights"]
          }
        }
      });

      // Extract text directly from the response property as per guidelines.
      if (!response.text) throw new Error("AI returned empty response");
      
      const result = JSON.parse(response.text.trim());
      setAnalysis(result);
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      // Handle the case where the API key might be invalid or project not found
      if (err.message && err.message.includes("Requested entity was not found")) {
        setNeedsKey(true);
        setError("API Key ของคุณไม่ถูกต้อง หรือไม่มีสิทธิ์เข้าถึงโมเดลนี้ กรุณาเลือกคีย์ใหม่ครับ");
      } else {
        setError("AI ประมวลผลล้มเหลว: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      // Trigger key selection dialog
      await window.aistudio.openSelectKey();
      // Assume success and proceed immediately to avoid race condition as per guidelines
      runAnalysis();
    }
  };

  useEffect(() => {
    const hasScores = teamPerformance.some(p => p.score > 0);
    if (hasScores && hasEnoughData && !analysis && !loading) {
      runAnalysis();
    }
  }, [teamPerformance, hasEnoughData]);

  return (
    <div className="space-y-10 mt-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-200">
            {loading ? <Loader2 size={32} className="animate-spin" /> : <BrainCircuit size={32} />}
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              AI Team Intelligence <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] rounded-full uppercase tracking-widest">Gemini 3 Pro</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1 font-bold italic">Deep reasoning performance insights</p>
          </div>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={loading || !hasEnoughData}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
            loading || !hasEnoughData 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-slate-900 text-white hover:bg-black shadow-2xl active:scale-95'
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          {loading ? "Analyzing..." : "Refresh Intelligence"}
        </button>
      </div>

      {!hasEnoughData ? (
        <div className="bg-white p-20 rounded-[4rem] border-4 border-dashed border-slate-50 text-center space-y-4">
           <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
              <BarChart3 size={40} />
           </div>
           <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800 uppercase">Awaiting Performance Data</h3>
              <p className="text-slate-400 font-bold text-sm max-w-xs mx-auto">กรุณาบันทึกข้อมูล Performance หรือ QA เพื่อให้ AI เริ่มการวิเคราะห์เชิงลึกครับ</p>
           </div>
        </div>
      ) : needsKey ? (
        <div className="bg-amber-50 p-16 rounded-[4rem] border border-amber-200 text-center space-y-8 shadow-sm">
           <div className="w-20 h-20 bg-white text-amber-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
              <Key size={40} />
           </div>
           <div className="space-y-3">
              <h3 className="text-2xl font-black text-amber-900">API Key Selection Required</h3>
              <p className="text-amber-700 font-bold text-sm max-w-md mx-auto leading-relaxed">
                สำหรับการเข้าถึงโมเดลวิเคราะห์ระดับสูง กรุณาคลิกเพื่อยืนยันการใช้ API Key ของคุณครับ
                <br />
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline text-amber-900 mt-2 block">Billing Documentation</a>
              </p>
           </div>
           <button 
             onClick={handleSelectKey}
             className="px-10 py-5 bg-amber-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-amber-700 active:scale-95 transition-all"
           >
             Connect Gemini API Key
           </button>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-10 rounded-[3.5rem] border border-rose-100 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
           <div className="p-5 bg-white text-rose-500 rounded-[2rem] shadow-lg"><AlertCircle size={40} /></div>
           <div className="flex-1 space-y-2">
              <h4 className="text-xl font-black text-rose-900">Analysis Halted</h4>
              <p className="text-rose-700 font-bold text-sm">{error}</p>
              <button onClick={runAnalysis} className="mt-4 px-6 py-3 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg">Retry Analysis</button>
           </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 animate-pulse">
          <div className="relative">
             <Loader2 size={80} className="animate-spin text-indigo-600 opacity-20" />
             <BrainCircuit size={40} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-slate-800 font-black uppercase tracking-[0.3em] text-xs">Correlating Team Datasets</p>
            <p className="text-slate-400 text-[10px] font-bold">Gemini 3 Pro is thinking...</p>
          </div>
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="space-y-10">
            <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                <Users className="text-blue-600" size={28} /> Team Dynamics Audit
              </h3>
              <div className="space-y-10">
                <div>
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] block mb-5 ml-1">Key Success Patterns</label>
                  <div className="space-y-3">
                    {analysis.teamStrengths.map((s, i) => (
                      <div key={i} className="px-8 py-5 bg-emerald-50 text-emerald-800 rounded-[2rem] font-bold text-sm flex items-center gap-5 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                        <CheckCircle2 size={24} className="text-emerald-500 shrink-0" /> {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] block mb-5 ml-1">Critical Gaps & Risks</label>
                  <div className="space-y-3">
                    {analysis.teamGaps.map((g, i) => (
                      <div key={i} className="px-8 py-5 bg-rose-50 text-rose-800 rounded-[2rem] font-bold text-sm flex items-center gap-5 border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                        <AlertCircle size={24} className="text-rose-500 shrink-0" /> {g}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-indigo-900 p-12 rounded-[4rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform"><Sparkles size={120} /></div>
              <h4 className="text-xl font-black flex items-center gap-4">
                <TrendingUp size={28} className="text-indigo-400" /> Executive Summary
              </h4>
              <p className="text-indigo-100 font-bold italic leading-relaxed text-lg">
                "ภาพรวมการทำงานในสัปดาห์นี้ชี้ให้เห็นถึงความพร้อมของทีมในระดับสูง แต่ต้องระวังเรื่อง Workload Balance เพื่อลดความเสี่ยงในการเกิดความผิดพลาดครับ"
              </p>
            </div>
          </div>

          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between border-b border-slate-50 pb-8">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-4">
                <Target className="text-rose-600" size={28} /> Individual Optimization
              </h3>
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-5 py-2 rounded-full uppercase tracking-widest shadow-sm">AI Insights: {analysis.individualInsights.length}</span>
            </div>
            <div className="space-y-8">
              {analysis.individualInsights.map((insight, i) => (
                <div key={i} className="p-10 rounded-[3rem] bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center font-black text-lg uppercase shadow-xl group-hover:bg-indigo-600 transition-colors">
                        {insight.staffName.substring(0, 2).toUpperCase()}
                      </div>
                      <p className="text-xl font-black text-slate-800 tracking-tight">{insight.staffName}</p>
                    </div>
                    <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm"><Zap size={20} className="text-blue-500" /></div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex gap-5">
                      <div className="mt-1"><AlertCircle size={20} className="text-rose-400" /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Focus Point</p>
                        <p className="text-base font-black text-slate-700">{insight.gapArea}</p>
                      </div>
                    </div>
                    <div className="flex gap-5 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                      <div className="mt-1"><MessageSquare size={20} className="text-blue-400" /></div>
                      <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5">Coach Recommendation</p>
                        <p className="text-sm font-bold text-slate-600 leading-relaxed">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default TeamAnalysis;
