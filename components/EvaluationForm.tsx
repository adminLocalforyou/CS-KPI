
import React, { useState } from 'react';
import { 
  ClipboardCheck, 
  Save, 
  ShieldCheck, 
  Zap, 
  Sparkles, 
  UserCheck, 
  BarChart3, 
  Rocket, 
  LayoutGrid
} from 'lucide-react';
import { TEAM_MEMBERS } from '../constants.tsx';
import { EvaluationRecord } from '../types.ts';

interface EvaluationFormProps {
  onAdd: (records: EvaluationRecord[]) => void;
  submissions: any[];
  projectSLA: {
    restaurant: { total: number; met: number };
    massage: { total: number; met: number };
    ai: { total: number; met: number };
  };
}

const DETAILED_RUBRICS = {
  Project: {
    title: "Project (Onboarding Phase)",
    icon: Rocket,
    color: "blue",
    questions: [
      { id: 'scoreA', title: "Communication & Clarity", options: [{ score: 100, label: "Excellent" }, { score: 80, label: "Standard" }, { score: 60, label: "Fair" }, { score: 40, label: "Needs Help" }, { score: 20, label: "Critical" }] },
      { id: 'scoreB', title: "Setup Speed & SLA", options: [{ score: 100, label: "Fast-Track" }, { score: 80, label: "On Target" }, { score: 60, label: "Minor Delay" }, { score: 40, label: "Lagging" }, { score: 20, label: "Stalled" }] },
      { id: 'scoreC', title: "SOP Quality", options: [{ score: 100, label: "Flawless" }, { score: 80, label: "Solid" }, { score: 60, label: "Basic" }, { score: 40, label: "Incomplete" }, { score: 20, label: "Risk Prone" }] }
    ]
  },
  Maintenance: {
    title: "Maintenance (Support)",
    icon: ShieldCheck,
    color: "emerald",
    questions: [
      { id: 'scoreA', title: "Tone & Professionalism", options: [{ score: 100, label: "Empathic" }, { score: 80, label: "Professional" }, { score: 60, label: "Neutral" }, { score: 40, label: "Brief" }, { score: 20, label: "Inappropriate" }] },
      { id: 'scoreB', title: "Resolution Speed", options: [{ score: 100, label: "Instant Fix" }, { score: 80, label: "Swift" }, { score: 60, label: "Acceptable" }, { score: 40, label: "Slow" }, { score: 20, label: "Abandoned" }] },
      { id: 'scoreC', title: "Accuracy", options: [{ score: 100, label: "Precision" }, { score: 80, label: "Accurate" }, { score: 60, label: "Minor Error" }, { score: 40, label: "Careless" }, { score: 20, label: "Damaging" }] }
    ]
  },
  SideTask: {
    title: "Side Task (Team)",
    icon: LayoutGrid,
    color: "purple",
    questions: [
      { id: 'scoreA', title: "Internal Coordination", options: [{ score: 100, label: "Leader" }, { score: 80, label: "Cooperative" }, { score: 60, label: "Functional" }, { score: 40, label: "Passive" }, { score: 20, label: "Isolated" }] },
      { id: 'scoreB', title: "Proactivity", options: [{ score: 100, label: "Proactive" }, { score: 80, label: "Active" }, { score: 60, label: "Reactive" }, { score: 40, label: "Reluctant" }, { score: 20, label: "Avoidant" }] },
      { id: 'scoreC', title: "Execution Quality", options: [{ score: 100, label: "Gold Std" }, { score: 80, label: "Good" }, { score: 60, label: "Average" }, { score: 40, label: "Sub-par" }, { score: 20, label: "Failing" }] }
    ]
  }
};

const EvaluationForm: React.FC<EvaluationFormProps> = ({ onAdd, projectSLA }) => {
  const [staffId, setStaffId] = useState(TEAM_MEMBERS[0].id);
  const [scores, setScores] = useState({
    Project: { scoreA: 80, scoreB: 80, scoreC: 80 },
    Maintenance: { scoreA: 80, scoreB: 80, scoreC: 80 },
    SideTask: { scoreA: 80, scoreB: 80, scoreC: 80 }
  });
  
  const [metrics, setMetrics] = useState({
    slaMetCount: 0, responseTimeMin: 5, projectCount: 0,
    incomingCalls: 0, outgoingCalls: 0, totalChats: 0, totalTasks: 0,
    note: '', caseRef: ''
  });

  const globalTotal = projectSLA.restaurant.total + projectSLA.massage.total + projectSLA.ai.total;

  const handleScoreUpdate = (type: keyof typeof scores, field: string, val: number) => {
    setScores(prev => ({ ...prev, [type]: { ...prev[type], [field]: val } }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = TEAM_MEMBERS.find(m => m.id === staffId);
    const date = new Date().toISOString().split('T')[0];
    const calculatedSlaPct = globalTotal > 0 ? Math.round((metrics.slaMetCount / globalTotal) * 100) : 0;

    const records: EvaluationRecord[] = (['Project', 'Maintenance', 'SideTask'] as const).map(type => ({
      id: Math.random().toString(36).substr(2, 9),
      staffId,
      staffName: staff?.name || 'Unknown',
      date,
      type,
      communicationScore: scores[type].scoreA,
      speedScore: scores[type].scoreB,
      processCompliance: scores[type].scoreC,
      followUpScore: 80,
      clarityScore: scores[type].scoreA, 
      onboardingQuality: scores[type].scoreC,
      slaMetCount: metrics.slaMetCount,
      slaTotalBase: globalTotal,
      individualSlaPct: calculatedSlaPct,
      responseTimeMin: metrics.responseTimeMin,
      projectCount: metrics.projectCount,
      daysToLive: 0,
      stepsCompleted: scores[type].scoreC >= 80 ? 10 : 7,
      incomingCalls: metrics.incomingCalls,
      outgoingCalls: metrics.outgoingCalls,
      totalChats: metrics.totalChats,
      totalTasks: metrics.totalTasks,
      issuesResolved: type === 'Maintenance' ? 1 : 0,
      customerFeedback: 85,
      sideTaskPoints: type === 'SideTask' ? 10 : 0,
      note: `${metrics.caseRef ? `[REF: ${metrics.caseRef}] ` : ''}${metrics.note}`
    }));

    onAdd(records);
    alert("บันทึก Performance สำเร็จ!");
  };

  return (
    <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100 max-w-6xl mx-auto mb-20">
      <div className="flex items-center gap-6 mb-12 pb-8 border-b border-slate-50">
        <ClipboardCheck className="text-slate-900" size={32} />
        <div>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Full Performance Log</h3>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Unified Evaluation System</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-16">
        <div className="bg-slate-50 p-8 rounded-[3rem]">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Staff Member</label>
          <select className="w-full bg-transparent font-black text-2xl text-slate-800 outline-none" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
            {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-blue-900 rounded-[3rem] p-10 text-white space-y-8">
             <h4 className="font-black text-lg uppercase flex items-center gap-3"><Zap className="text-blue-400" /> SLA & Efficiency</h4>
             <div className="grid grid-cols-3 gap-6">
                <input type="number" className="w-full bg-white/10 rounded-xl p-3 font-black outline-none" placeholder="SLA Met" value={metrics.slaMetCount} onChange={(e) => setMetrics({...metrics, slaMetCount: parseInt(e.target.value) || 0})} />
                <input type="number" step="0.1" className="w-full bg-white/10 rounded-xl p-3 font-black outline-none" placeholder="Min" value={metrics.responseTimeMin} onChange={(e) => setMetrics({...metrics, responseTimeMin: parseFloat(e.target.value) || 0})} />
                <input type="number" className="w-full bg-white/10 rounded-xl p-3 font-black outline-none" placeholder="Proj" value={metrics.projectCount} onChange={(e) => setMetrics({...metrics, projectCount: parseInt(e.target.value) || 0})} />
             </div>
          </div>
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white space-y-8">
             <h4 className="font-black text-lg uppercase flex items-center gap-3"><BarChart3 className="text-indigo-400" /> Workload Summary</h4>
             <div className="grid grid-cols-4 gap-4">
                <input type="number" className="w-full bg-white/5 rounded-xl p-3 font-black outline-none" placeholder="Inc" value={metrics.incomingCalls} onChange={(e) => setMetrics({...metrics, incomingCalls: parseInt(e.target.value) || 0})} />
                <input type="number" className="w-full bg-white/5 rounded-xl p-3 font-black outline-none" placeholder="Out" value={metrics.outgoingCalls} onChange={(e) => setMetrics({...metrics, outgoingCalls: parseInt(e.target.value) || 0})} />
                <input type="number" className="w-full bg-white/5 rounded-xl p-3 font-black outline-none" placeholder="Chat" value={metrics.totalChats} onChange={(e) => setMetrics({...metrics, totalChats: parseInt(e.target.value) || 0})} />
                <input type="number" className="w-full bg-white/5 rounded-xl p-3 font-black outline-none" placeholder="Task" value={metrics.totalTasks} onChange={(e) => setMetrics({...metrics, totalTasks: parseInt(e.target.value) || 0})} />
             </div>
          </div>
        </div>

        <div className="space-y-24">
          {(['Project', 'Maintenance', 'SideTask'] as const).map((type) => {
            const config = DETAILED_RUBRICS[type];
            return (
              <div key={type} className="space-y-12">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                   <config.icon className={`text-${config.color}-600`} size={28} />
                   <h4 className="text-2xl font-black text-slate-800">{config.title}</h4>
                </div>
                <div className="space-y-16">
                   {config.questions.map((q) => (
                     <div key={q.id} className="space-y-6">
                        <label className="text-[11px] font-black text-slate-400 uppercase">{q.title}</label>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                          {q.options.map((opt) => (
                            <button key={opt.score} type="button" onClick={() => handleScoreUpdate(type, q.id, opt.score)} className={`p-5 rounded-[2.5rem] border-2 font-black transition-all ${ (scores[type] as any)[q.id] === opt.score ? `bg-${config.color}-600 border-${config.color}-600 text-white shadow-xl` : 'bg-white border-slate-50 text-slate-300' }`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-50 p-12 rounded-[4rem] space-y-4">
           <input type="text" placeholder="Reference Case #" className="w-full bg-white border border-slate-200 rounded-2xl p-6 font-bold outline-none" value={metrics.caseRef} onChange={(e) => setMetrics({...metrics, caseRef: e.target.value})} />
           <textarea rows={3} placeholder="Manager's Notes..." className="w-full bg-white border border-slate-200 rounded-[2rem] p-6 outline-none resize-none font-medium" value={metrics.note} onChange={(e) => setMetrics({...metrics, note: e.target.value})} />
        </div>

        <button type="submit" className="w-full bg-indigo-600 text-white font-black py-10 rounded-[3rem] shadow-2xl transition-all flex items-center justify-center gap-4">
          <Save size={40} /> Confirm Report
        </button>
      </form>
    </div>
  );
};

export default EvaluationForm;
