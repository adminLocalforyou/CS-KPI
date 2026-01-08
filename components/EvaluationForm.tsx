import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Save, 
  MessageCircle, 
  Target,
  ShieldCheck,
  Zap,
  Sparkles,
  UserCheck,
  BarChart3,
  GraduationCap,
  Clock,
  Rocket,
  LayoutGrid,
  PhoneIncoming,
  PhoneOutgoing
} from 'lucide-react';
import { TEAM_MEMBERS } from '../constants.tsx';
import { EvaluationRecord, TestSubmission } from '../types.ts';

interface EvaluationFormProps {
  onAdd: (records: EvaluationRecord[]) => void;
  submissions: TestSubmission[];
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
      { 
        id: 'scoreA', 
        title: "Onboarding Communication & Clarity", 
        options: [
          { score: 100, label: "Excellent", desc: "ลูกค้าเข้าใจระบบชัดเจนมาก สื่อสารโปร่งใส สุภาพ และ Proactive" },
          { score: 80, label: "Standard", desc: "สื่อสารครบถ้วนตามขั้นตอน ไม่มีข้อมูลผิดพลาด" },
          { score: 60, label: "Fair", desc: "สื่อสารรู้เรื่องแต่ต้องให้ลูกค้าถามซ้ำในบางจุด" },
          { score: 40, label: "Needs Help", desc: "สื่อสารไม่ครบ ข้ามขั้นตอนสำคัญในการอธิบาย" },
          { score: 20, label: "Critical", desc: "ข้อมูลผิดร้ายแรง จนลูกค้าสับสนหรือระบบพัง" }
        ] 
      },
      { 
        id: 'scoreB', 
        title: "Setup Speed & SLA Compliance", 
        options: [
          { score: 100, label: "Fast-Track", desc: "เสร็จก่อน SLA กำหนด (เช่น เสร็จใน 5 วัน จากเป้า 10 วัน)" },
          { score: 80, label: "On Target", desc: "ทำตาม Timeline ที่วางไว้เป๊ะ ไม่มีการดีเลย์" },
          { score: 60, label: "Minor Delay", desc: "ล่าช้า 1-2 วัน แต่มีการแจ้ง Progress ล่วงหน้า" },
          { score: 40, label: "Lagging", desc: "ดีเลย์เกินกำหนดโดยไม่มีเหตุผล หรือไม่แจ้งลูกค้า" },
          { score: 20, label: "Stalled", desc: "งานค้างนานจนลูกค้าตาม ลืมอัปเดตงานเกิน 1 สัปดาห์" }
        ] 
      },
      { 
        id: 'scoreC', 
        title: "SOP & Onboarding Quality", 
        options: [
          { score: 100, label: "Flawless", desc: "Checklist ครบ 100% บันทึก CRM ละเอียด และเทสระบบก่อน Live" },
          { score: 80, label: "Solid", desc: "ทำตาม SOP ครบถ้วน ขั้นตอนถูกต้อง บันทึกข้อมูลชัดเจน" },
          { score: 60, label: "Basic", desc: "ข้ามขั้นตอนย่อยบางอย่าง แต่ระบบหลักยังทำงานได้" },
          { score: 40, label: "Incomplete", desc: "ลืมบันทึกข้อมูลสำคัญ หรือข้ามขั้นตอนการทดสอบ" },
          { score: 20, label: "Risk Prone", desc: "ไม่ทำตามขั้นตอนจนเกิดปัญหาหน้างานหลังจาก Live" }
        ] 
      }
    ]
  },
  Maintenance: {
    title: "Maintenance (Standard Support)",
    icon: ShieldCheck,
    color: "emerald",
    questions: [
      { 
        id: 'scoreA', 
        title: "Response Tone & Professionalism", 
        options: [
          { score: 100, label: "Empathic", desc: "เห็นใจลูกค้า จัดการอารมณ์ลูกค้าได้ดีเยี่ยม สุภาพมาก" },
          { score: 80, label: "Professional", desc: "ตอบตามมาตรฐาน สุภาพ และแสดงความเป็นมืออาชีพ" },
          { score: 60, label: "Neutral", desc: "สื่อสารสั้น กระชับ แต่อาจดูแข็ง (Robotic) ไปนิดหน่อย" },
          { score: 40, label: "Brief", desc: "ตอบคำถามสั้นเกินไปจนดูเหมือนไม่เต็มใจให้บริการ" },
          { score: 20, label: "Inappropriate", desc: "น้ำเสียงประชด หรือโต้เถียงกับลูกค้าในเคสปัญหา" }
        ] 
      },
      { 
        id: 'scoreB', 
        title: "Resolution & Fix Speed", 
        options: [
          { score: 100, label: "Instant Fix", desc: "แก้ปัญหา/อัปเดตเมนูเสร็จทันที หรือภายในไม่กี่นาที" },
          { score: 80, label: "Swift", desc: "แก้ไขได้ภายในระยะเวลาที่กำหนด (SLA Support)" },
          { score: 60, label: "Acceptable", desc: "ใช้เวลานานกว่าปกติเล็กน้อยแต่จบงานได้เรียบร้อย" },
          { score: 40, label: "Slow", desc: "งานค้างเกิน 1 วันสำหรับเคสง่ายๆ หรือลูกค้าต้องตาม" },
          { score: 20, label: "Abandoned", desc: "ดองเคสทิ้งไว้ข้ามวันโดยไม่มีอัปเดตจนลูกค้าตำหนิ" }
        ] 
      },
      { 
        id: 'scoreC', 
        title: "Accuracy & Data Integrity", 
        options: [
          { score: 100, label: "Precision", desc: "ข้อมูลถูกต้อง 100% เช็คซ้ำหลายรอบ บันทึกละเอียด" },
          { score: 80, label: "Accurate", desc: "แก้ไขข้อมูลได้ถูกต้องตามคำสั่ง ไม่มีความผิดพลาด" },
          { score: 60, label: "Minor Error", desc: "มีจุดผิดเล็กน้อยที่ไม่กระทบระบบหลัก (เช่น สะกดผิด)" },
          { score: 40, label: "Careless", desc: "ใส่ข้อมูลผิดบ่อยครั้งจนต้องให้ Manager มาแก้ตาม" },
          { score: 20, label: "Damaging", desc: "แก้ข้อมูลผิดจนระบบเสียหาย หรือปิดการขายไม่ได้" }
        ] 
      }
    ]
  },
  SideTask: {
    title: "Side Task (Team Support)",
    icon: LayoutGrid,
    color: "purple",
    questions: [
      { 
        id: 'scoreA', 
        title: "Internal Coordination", 
        options: [
          { score: 100, label: "Leader", desc: "ประสานงานดีเยี่ยม รายงานผลชัดเจน ช่วยคนอื่นได้ด้วย" },
          { score: 80, label: "Cooperative", desc: "ทำงานร่วมกับทีมได้ดี สื่อสารเข้าใจง่าย" },
          { score: 60, label: "Functional", desc: "ทำงานของตัวเองได้ แต่ไม่ค่อยแชร์ข้อมูลให้ทีม" },
          { score: 40, label: "Passive", desc: "ต้องให้ตามถามถึงจะอัปเดต สื่อสารภายในไม่ชัดเจน" },
          { score: 20, label: "Isolated", desc: "ไม่สื่อสารกับใครเลย จนงานอื่นได้รับผลกระทบ" }
        ] 
      },
      { 
        id: 'scoreB', 
        title: "Initiative & Proactivity", 
        options: [
          { score: 100, label: "Proactive", desc: "เสนอทางเลือกใหม่ๆ หรือทำเกินสั่งเพื่อคุณภาพที่ดีขึ้น" },
          { score: 80, label: "Active", desc: "ทำตามหน้าที่ที่ได้รับมอบหมายอย่างกระตือรือร้น" },
          { score: 60, label: "Reactive", desc: "ทำตามสั่งเท่านั้น ไม่มีความคิดริเริ่มเพิ่มเติม" },
          { score: 40, label: "Reluctant", desc: "ทำแบบขอไปที หรือต้องคอยกระตุ้นบ่อยๆ" },
          { score: 20, label: "Avoidant", desc: "พยายามเลี่ยงงานเสริม หรือทำไม่มีคุณภาพเลย" }
        ] 
      },
      { 
        id: 'scoreC', 
        title: "Execution Quality", 
        options: [
          { score: 100, label: "Gold Std", desc: "งานเสริมคุณภาพเท่ากับงานหลัก สวยงาม ถูกต้อง" },
          { score: 80, label: "Good", desc: "ผลงานดี เป็นที่น่าพอใจ ใช้งานได้จริง" },
          { score: 60, label: "Average", desc: "คุณภาพพอใช้ มีจุดต้องปรับปรุงบ้าง" },
          { score: 40, label: "Sub-par", desc: "ผลลัพธ์ไม่ตรงตามโจทย์ หรือทำลวกๆ" },
          { score: 20, label: "Failing", desc: "งานล้มเหลว หรือต้องเอาไปทำใหม่ทั้งหมด" }
        ] 
      }
    ]
  }
};

const EvaluationForm: React.FC<EvaluationFormProps> = ({ onAdd, submissions, projectSLA }) => {
  const [staffId, setStaffId] = useState(TEAM_MEMBERS[0].id);
  const [scores, setScores] = useState({
    Project: { scoreA: 80, scoreB: 80, scoreC: 80 },
    Maintenance: { scoreA: 80, scoreB: 80, scoreC: 80 },
    SideTask: { scoreA: 80, scoreB: 80, scoreC: 80 }
  });
  
  const [metrics, setMetrics] = useState({
    slaMetCount: 0,
    responseTimeMin: 5,
    projectCount: 0,
    incomingCalls: 0,
    outgoingCalls: 0,
    totalChats: 0,
    totalTasks: 0,
    note: '',
    caseRef: ''
  });

  const [integratedTestScore, setIntegratedTestScore] = useState<number | undefined>(undefined);

  useEffect(() => {
    const staff = TEAM_MEMBERS.find(m => m.id === staffId);
    if (staff) {
      const staffSubmissions = submissions
        .filter(s => s.staffName === staff.name && s.isGraded)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (staffSubmissions.length > 0) {
        const latest = staffSubmissions[0];
        setIntegratedTestScore(Math.round(((latest.autoScore + latest.manualScore) / latest.totalPossiblePoints) * 100));
      } else {
        setIntegratedTestScore(undefined);
      }
    }
  }, [staffId, submissions]);

  const globalTotal = projectSLA.restaurant.total + projectSLA.massage.total + projectSLA.ai.total;

  const handleScoreUpdate = (type: keyof typeof scores, field: string, val: number) => {
    setScores(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: val }
    }));
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
      
      latestTestScore: integratedTestScore,
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
    alert("บันทึกข้อมูล Performance ก้อนเดียวสำเร็จแล้ว!");
  };

  return (
    <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100 max-w-6xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-12 pb-8 border-b border-slate-50">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-2xl">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Full Performance Log</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Unified Evaluation System (BARS)</p>
          </div>
        </div>
        {integratedTestScore !== undefined && (
          <div className="flex items-center gap-4 bg-blue-50 px-6 py-4 rounded-3xl border border-blue-100">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><GraduationCap size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Latest Exam</p>
              <p className="text-2xl font-black text-blue-700">{integratedTestScore}%</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-16">
        {/* Staff Selection */}
        <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-900"><UserCheck size={24} /></div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Staff Under Review</label>
              <select 
                className="w-full bg-transparent font-black text-2xl text-slate-800 outline-none cursor-pointer"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              >
                {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Quantitative Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-blue-900 rounded-[3rem] p-10 text-white shadow-xl space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 pointer-events-none"><Rocket size={140}/></div>
             <h4 className="font-black text-lg uppercase flex items-center gap-3"><Sparkles className="text-blue-400" /> SLA & Efficiency (Individual)</h4>
             <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-blue-400">SLA Met</span>
                  <input type="number" className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-2xl font-black text-white outline-none" value={metrics.slaMetCount} onChange={(e) => setMetrics({...metrics, slaMetCount: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-blue-400">Resp (min)</span>
                  <input type="number" step="0.01" className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-2xl font-black text-white outline-none" value={metrics.responseTimeMin} onChange={(e) => setMetrics({...metrics, responseTimeMin: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-blue-400">Project Count</span>
                  <input type="number" className="w-full bg-white/10 border border-white/10 rounded-xl p-3 text-2xl font-black text-white outline-none" value={metrics.projectCount} onChange={(e) => setMetrics({...metrics, projectCount: parseInt(e.target.value) || 0})} />
                </div>
             </div>
          </div>

          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl space-y-8">
             <h4 className="font-black text-lg uppercase flex items-center gap-3"><BarChart3 className="text-indigo-400" /> Workload Summary</h4>
             <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Inc</span>
                  <input type="number" className="w-full bg-white/5 border border-white/5 rounded-xl p-3 font-black text-white outline-none" value={metrics.incomingCalls} onChange={(e) => setMetrics({...metrics, incomingCalls: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Out</span>
                  <input type="number" className="w-full bg-white/5 border border-white/5 rounded-xl p-3 font-black text-white outline-none" value={metrics.outgoingCalls} onChange={(e) => setMetrics({...metrics, outgoingCalls: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Chats</span>
                  <input type="number" className="w-full bg-white/5 border border-white/5 rounded-xl p-3 font-black text-white outline-none" value={metrics.totalChats} onChange={(e) => setMetrics({...metrics, totalChats: parseInt(e.target.value) || 0})} />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Tasks</span>
                  <input type="number" className="w-full bg-white/5 border border-white/5 rounded-xl p-3 font-black text-white outline-none" value={metrics.totalTasks} onChange={(e) => setMetrics({...metrics, totalTasks: parseInt(e.target.value) || 0})} />
                </div>
             </div>
          </div>
        </div>

        {/* Detailed Rubrics Scoring */}
        <div className="space-y-24">
          {(['Project', 'Maintenance', 'SideTask'] as const).map((type) => {
            const config = DETAILED_RUBRICS[type];
            return (
              <div key={type} className="space-y-12">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                   <div className={`p-4 bg-${config.color}-50 text-${config.color}-600 rounded-2xl shadow-sm`}><config.icon size={28} /></div>
                   <h4 className="text-2xl font-black text-slate-800">{config.title}</h4>
                </div>

                <div className="space-y-16">
                   {config.questions.map((q) => (
                     <div key={q.id} className="space-y-6">
                        <div className="flex justify-between items-center px-2">
                           <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{q.title}</label>
                           <span className={`text-xl font-black text-${config.color}-600`}>{(scores[type] as any)[q.id]}%</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                          {q.options.map((opt) => (
                            <button
                              key={opt.score}
                              type="button"
                              onClick={() => handleScoreUpdate(type, q.id, opt.score)}
                              className={`flex flex-col items-center p-5 rounded-[2.5rem] border-2 transition-all text-center h-full group ${
                                (scores[type] as any)[q.id] === opt.score 
                                ? `bg-${config.color}-600 border-${config.color}-600 text-white shadow-xl scale-105 z-10` 
                                : 'bg-white border-slate-50 text-slate-300 hover:border-slate-200'
                              }`}
                            >
                              <span className="text-lg font-black mb-1">{opt.label}</span>
                              <span className={`text-[10px] font-bold leading-tight opacity-80 ${ (scores[type] as any)[q.id] === opt.score ? 'text-white' : 'text-slate-400' }`}>
                                {opt.desc}
                              </span>
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

        {/* Feedback Summary */}
        <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-100 space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">Reference Case #</label>
                 <input type="text" placeholder="e.g. Case #1234" className="w-full bg-white border border-slate-200 rounded-2xl p-6 font-bold outline-none" value={metrics.caseRef} onChange={(e) => setMetrics({...metrics, caseRef: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">Manager's Notes</label>
                 <textarea rows={3} placeholder="Provide specific feedback summarizing all 3 contexts..." className="w-full bg-white border border-slate-200 rounded-[2rem] p-6 outline-none resize-none font-medium" value={metrics.note} onChange={(e) => setMetrics({...metrics, note: e.target.value})} />
              </div>
           </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-10 rounded-[3rem] shadow-2xl transition-all flex flex-col items-center justify-center gap-2 group active:scale-95">
          <div className="flex items-center gap-6 text-3xl">
            <Save size={40} /> Confirm Unified Report
          </div>
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">บันทึกคะแนนรวมทั้ง 3 หมวดหมู่ลงในฐานข้อมูล</p>
        </button>
      </form>
    </div>
  );
};

export default EvaluationForm;