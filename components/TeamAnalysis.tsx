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
  ShieldAlert
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { EvaluationRecord, QARecord } from '../types.ts';

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

  const hasEnoughData = evaluations.length > 0 || qaRecords.length > 0;

  const runAnalysis = async () => {
    if (!hasEnoughData) {
      setError("ไม่มีข้อมูลดิบ (Logs หรือ QA) เพียงพอสำหรับการวิเคราะห์ กรุณาบันทึกข้อมูลก่อนครับ");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // CRITICAL: Always create new instance inside the call
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

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
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
      setError("AI ประมวลผลล้มเหลว: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  // Improved Effect: Trigger when teamPerformance is actually loaded with real scores
  useEffect(() => {
    const hasScores = teamPerformance.some(p => p.score > 0);
    if (hasScores && hasEnoughData && !analysis) {
      runAnalysis();
    }
  }, [teamPerformance, hasEnoughData]);

  return (
    <div className="space-y-10 mt-12">
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><BrainCircuit size={200} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-lg shadow-indigo-500/30">
              {loading ? <Loader2 size={40} className="animate-spin text-white" /> : <Sparkles size={40} className="text-white" />}
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight">AI Team Intelligence</h2>
              <p className="text-slate-400 text-lg mt-1 font-medium italic">Analyzing Efficiency, SLA Accuracy, and Project Volume</p>
            </div>
          </div>
          <button 
            onClick={runAnalysis}
            disabled={loading || !hasEnoughData}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black transition-all ${
              loading || !hasEnoughData 
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
              : 'bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/10'
            }`}
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <RefreshCcw size={20} />}
            {loading ? "Analyzing Data..." : "Refresh Intelligence"}
          </button>
        </div>
      </div>

      {!hasEnoughData ? (
        <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-300 text-center space-y-6">
           <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert size={48} />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-black text-slate-800">NO EVALUATION DATA FOUND</h3>
              <p className="text-slate-400 font-bold max-w-sm mx-auto">กรุณาบันทึก "Performance Log" หรือผลการตรวจ "QA Checks" ของพนักงานก่อน เพื่อให้ AI วิเคราะห์ประสิทธิภาพได้</p>
           </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 p-12 rounded-[3rem] border border-rose-100 flex items-center gap-8">
           <AlertCircle size={48} className="text-rose-500 flex-shrink-0" />
           <div className="space-y-2">
              <h4 className="text-xl font-black text-rose-900">Analysis Halted</h4>
              <p className="text-rose-700 font-bold">{error}</p>
              <button onClick={runAnalysis} className="mt-4 px-6 py-2 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all">Try Again</button>
           </div>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={64} className="animate-spin text-indigo-600" />
          <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-sm">Gemini is correlating SLA vs Response Speed...</p>
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
              <p className="text-indigo-100 font-bold italic leading-relaxed">
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