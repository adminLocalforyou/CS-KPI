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
  Target
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

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prepare rich data for AI including new quantitative metrics
      const teamContext = teamPerformance.map(p => {
        const staffEvals = evaluations.filter(e => e.staffId === p.id);
        const latestEval = staffEvals.length > 0 ? staffEvals[staffEvals.length - 1] : null;
        
        return {
          name: p.name,
          compositeScore: p.score,
          individualSla: latestEval?.individualSlaPct || 0,
          responseSpeed: latestEval?.responseTimePct || 0,
          liveProjectsThisMonth: latestEval?.monthlyLiveCount || 0,
          totalTasks: latestEval?.totalTasks || 0
        };
      });

      const prompt = `
        Analyze this Customer Support team performance data.
        Focus on Efficiency (Live projects, Response Speed) vs Quality (Composite score, SLA).
        Team Data: ${JSON.stringify(teamContext)}
        
        Task:
        1. Identify overall team gaps (e.g., speed vs quality balance).
        2. Identify team strengths.
        3. Provide specific insights for individuals. 
           - Look for those with high workload but low quality (Burnout risk).
           - Look for those with high speed but low SLA (Accuracy issues).
           - Highlight those with high 'Live projects' as key contributors.
        
        Return the result in JSON format matching the schema. Insights must be in Thai.
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

      const result = JSON.parse(response.text || '{}');
      setAnalysis(result);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamPerformance.length > 0) {
      runAnalysis();
    }
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none rotate-12"><BrainCircuit size={200} /></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-lg shadow-indigo-500/30">
              {loading ? <Loader2 size={40} className="animate-spin" /> : <Sparkles size={40} />}
            </div>
            <div>
              <h2 className="text-4xl font-black tracking-tight">AI Team Intelligence</h2>
              <p className="text-slate-400 text-lg mt-1 font-medium italic">Analyzing Efficiency, SLA Accuracy, and Project Volume</p>
            </div>
          </div>
          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white font-black px-8 py-4 rounded-2xl border border-white/10 flex items-center gap-3 transition-all"
          >
            {loading ? "Analyzing..." : "Refresh Intelligence"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={48} className="animate-spin text-blue-600" />
          <p className="text-slate-400 font-black uppercase tracking-widest text-sm">AI is correlating SLA and Speed metrics...</p>
        </div>
      ) : analysis ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* Team Level Analysis */}
          <div className="space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Users className="text-blue-600" /> Team Health Overview
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-3">Core Strengths</label>
                  <div className="flex flex-wrap gap-2">
                    {analysis.teamStrengths.map((s, i) => (
                      <span key={i} className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm flex items-center gap-2">
                        <CheckCircle2 size={14} /> {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest block mb-3">System Gaps & Risk Areas</label>
                  <div className="flex flex-wrap gap-2">
                    {analysis.teamGaps.map((g, i) => (
                      <span key={i} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl font-bold text-sm flex items-center gap-2">
                        <AlertCircle size={14} /> {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-900 p-10 rounded-[3rem] text-white space-y-6">
              <h4 className="text-lg font-black flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-400" /> Efficiency Observation
              </h4>
              <p className="text-indigo-200 text-sm italic">"ข้อมูล SLA และความเร็วในการตอบแชทช่วยให้เห็นว่าทีมรักษามาตรฐานได้ดีในงานโปรเจกต์ แต่ในส่วนของงาน Maintenance ยังมีคอขวดในบางช่วงเวลา"</p>
            </div>
          </div>

          {/* Individual Focus Areas */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Target className="text-rose-600" /> Tailored Individual Analysis
              </h3>
              <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-3 py-1 rounded-full">INSIGHTS: {analysis.individualInsights.length}</span>
            </div>

            {analysis.individualInsights.length > 0 ? (
              <div className="space-y-6">
                {analysis.individualInsights.map((insight, i) => (
                  <div key={i} className="p-6 rounded-3xl bg-slate-50 border border-slate-100 hover:border-rose-200 transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase">
                          {insight.staffName.substring(0, 2)}
                        </div>
                        <p className="font-black text-slate-800">{insight.staffName}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-widest">Efficiency Tip</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="mt-1"><AlertCircle size={16} className="text-rose-500" /></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Focus Area</p>
                          <p className="text-sm font-bold text-slate-700">{insight.gapArea}</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="mt-1"><Zap size={16} className="text-blue-500" /></div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">AI Suggestion</p>
                          <p className="text-sm font-medium text-slate-600 leading-relaxed">{insight.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center space-y-4">
                 <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} />
                 </div>
                 <p className="font-black text-slate-800">Excellent balance across the team.</p>
              </div>
            )}
          </div>

        </div>
      ) : (
        <div className="bg-white p-20 rounded-[3rem] border border-dashed border-slate-300 text-center space-y-4">
           <Zap size={48} className="mx-auto text-slate-200" />
           <p className="font-black text-slate-400 uppercase tracking-widest">No Efficiency Data Analyzed</p>
           <button onClick={runAnalysis} className="text-blue-600 font-black text-sm hover:underline">Click here to start correlation analysis</button>
        </div>
      )}
    </div>
  );
};

export default TeamAnalysis;