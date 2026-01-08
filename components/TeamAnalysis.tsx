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
  Key
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationRecord, QARecord } from '../types.ts';

// Fix: Define AIStudio and use it to type window.aistudio to avoid conflicts with global declarations.
interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    readonly aistudio: AIStudio;
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
      // Check for API key availability
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey && !process.env.API_KEY) {
        setNeedsKey(true);
        setLoading(false);
        return;
      }

      // CRITICAL: Always create new instance inside the call to get the latest key
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
        - If score is low but workload is high, mention burnout risk.
        - If response time is high (>10 min), flag as bottleneck.
        - If SLA is low, suggest SOP training.
        - Highlight high performers who handle many projects.
        
        Task: 
        1. Identify team strengths.
        2. Identify team gaps.
        3. Provide individual tips for at least 3 people.
        
        Language: Thai language.
        Format: JSON exactly matching the schema.
      `;

      // Upgraded to gemini-3-pro-preview for complex reasoning task
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

      if (!response.text) throw new Error("AI returned empty response");
      
      const result = JSON.parse(response.text.trim());
      setAnalysis(result);
    } catch (err: any) {
      console.error("AI Analysis failed:", err);
      // Handle missing entity or key error by resetting key selection
      if (err.message?.includes("Requested entity was not found") || err.message?.includes("API Key")) {
        setNeedsKey(true);
      } else {
        setError("AI ประมวลผลล้มเหลว: " + (err.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectKey = async () => {
    await window.aistudio.openSelectKey();
    runAnalysis(); // Re-trigger analysis after key selection
  };

  useEffect(() => {
    const hasScores = teamPerformance.some(p => p.score > 0);
    if (hasScores && hasEnoughData && !analysis) {
      runAnalysis();
    }
  }, [teamPerformance, hasEnoughData]);

  return (
    <div className="space-y-10 mt-12">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            {loading ? <Loader2 size={32} className="animate-spin" /> : <Sparkles size={32} />}
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
              AI Team Intelligence <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] rounded-full uppercase">Gemini 3 Pro</span>
            </h2>
            <p className="text-slate-400 text-sm mt-0.5 font-medium italic">Efficiency & SLA Performance Insights</p>
          </div>
        </div>
        <button 
          onClick={runAnalysis}
          disabled={loading || !hasEnoughData}
          className={`flex items-center gap-3 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
            loading || !hasEnoughData 
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
            : 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-black/10'
          }`}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
          {loading ? "Analyzing..." : "Refresh Intelligence"}
        </button>
      </div>

      {!hasEnoughData ? (
        <div className="bg-white p-12 rounded-[3rem] border border-dashed border-slate-300 text-center space-y-4">
           <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert size={32} />
           </div>
           <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 uppercase">Awaiting Performance Data</h3>
              <p className="text-slate-400 font-bold text-xs max-w-xs mx-auto">กรุณาบันทึก "Performance Log" หรือผล "QA Checks" เพื่อให้ AI เริ่มการวิเคราะห์ทีม</p>
           </div>
        </div>
      ) : needsKey ? (
        <div className="bg-amber-50 p-12 rounded-[3rem] border border-amber-200 text-center space-y-6 animate-in zoom-in-95">
           <div className="w-16 h-16 bg-white text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Key size={32} />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-black text-amber-900">API Key Required</h3>
              <p className="text-amber-700 font-bold text-sm max-w-md mx-auto">
                สำหรับการวิเคราะห์เชิงลึกด้วย Gemini 3 Pro กรุณาเลือก API Key จากโปรเจกต์ที่มีการตั้งค่า Billing เรียบร้อยแล้ว
              </p>
              <p className="text-[10px] text-amber-500 font-medium">ดูข้อมูลเพิ่มเติมที่: ai.google.dev/gemini-api/docs/billing</p>
           </div>
           <button 
             onClick={handleSelectKey}
             className="px-8 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-amber-700 active:scale-95 transition-all"
           >
             Connect Gemini API Key
           </button>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 flex items-center gap-6">
           <AlertCircle size={32} className="text-rose-500 flex-shrink-0" />
           <div className="space-y-1">
              <h4 className="text-lg font-black text-rose-900">Analysis Halted</h4>
              <p className="text-rose-700 font-bold text-sm">{error}</p>
              <button onClick={runAnalysis} className="mt-2 px-4 py-2 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all">Retry Analysis</button>
           </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader2 size={48} className="animate-spin text-indigo-600" />
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Gemini Pro is correlating team SLA datasets...</p>
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-in fade-in duration-700">
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Users className="text-blue-600" /> Team Health Overview
              </h3>
              <div className="space-y-8">
                <div>
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-4">Core Strengths</label>
                  <div className="grid grid-cols-1 gap-3">
                    {analysis.teamStrengths.map((s, i) => (
                      <div key={i} className="px-6 py-4 bg-emerald-50 text-emerald-800 rounded-2xl font-bold text-sm flex items-center gap-4 border border-emerald-100 shadow-sm">
                        <CheckCircle2 size={20} className="text-emerald-500" /> {s}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-4">System Gaps & Risk Areas</label>
                  <div className="grid grid-cols-1 gap-3">
                    {analysis.teamGaps.map((g, i) => (
                      <div key={i} className="px-6 py-4 bg-rose-50 text-rose-800 rounded-2xl font-bold text-sm flex items-center gap-4 border border-rose-100 shadow-sm">
                        <AlertCircle size={20} className="text-rose-500" /> {g}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-indigo-900 p-10 rounded-[3rem] text-white space-y-4">
              <h4 className="text-lg font-black flex items-center gap-3">
                <TrendingUp size={24} className="text-indigo-400" /> Efficiency Observation
              </h4>
              <p className="text-indigo-100 font-bold italic leading-relaxed text-sm">
                "ข้อมูลพฤติกรรมการทำงานรายบุคคลชี้ให้เห็นว่าทีมส่วนใหญ่รักษามาตรฐาน SLA ได้ดี แต่อาจต้องเพิ่มความเร็วในการตอบสนองในหมวดหมู่ Maintenance"
              </p>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between border-b border-slate-50 pb-6">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Target className="text-rose-600" /> Tailored Individual Analysis
              </h3>
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-4 py-1.5 rounded-full uppercase tracking-widest">AI Insights: {analysis.individualInsights.length}</span>
            </div>
            <div className="space-y-6">
              {analysis.individualInsights.map((insight, i) => (
                <div key={i} className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:border-rose-200 transition-all group shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-sm uppercase shadow-lg group-hover:bg-blue-600 transition-colors">
                        {insight.staffName.substring(0, 2)}
                      </div>
                      <p className="text-lg font-black text-slate-800">{insight.staffName}</p>
                    </div>
                    <div className="p-2 bg-white rounded-xl border border-slate-100"><Zap size={18} className="text-blue-500" /></div>
                  </div>
                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="mt-1"><AlertCircle size={18} className="text-rose-400" /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Focus Area</p>
                        <p className="text-sm font-black text-slate-700">{insight.gapArea}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 p-5 bg-white border border-slate-100 rounded-2xl">
                      <div className="mt-1"><Sparkles size={18} className="text-blue-400" /></div>
                      <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">AI Recommendation</p>
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