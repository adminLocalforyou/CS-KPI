import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, 
  Save, 
  PhoneIncoming, 
  PhoneOutgoing, 
  MessageCircle, 
  ClipboardList, 
  AlertCircle, 
  Info, 
  Link as LinkIcon,
  Target,
  ShieldCheck,
  Zap,
  Sparkles,
  UserCheck,
  BarChart3,
  GraduationCap,
  Clock,
  Rocket,
  ChevronDown
} from 'lucide-react';
import { TEAM_MEMBERS } from '../constants.tsx';
import { EvaluationRecord, TestSubmission, ProjectSubCategory } from '../types.ts';

interface EvaluationFormProps {
  onAdd: (record: EvaluationRecord) => void;
  submissions: TestSubmission[];
  projectSLA: {
    restaurant: { total: number; met: number };
    massage: { total: number; met: number };
    ai: { total: number; met: number };
  };
}

const CONTEXT_RUBRICS = {
  Project: [
    {
      id: 'scoreA',
      title: "Onboarding Communication & Clarity",
      options: [
        { score: 100, label: "Excellent", desc: "ลูกค้าเข้าใจระบบชัดเจนมาก สื่อสารโปร่งใส สุภาพ และ Proactive" },
        { score: 80, label: "Standard", desc: "สื่อสารครบถ้วนตามขั้นตอน Onboarding ไม่มีข้อมูลผิดพลาด" },
        { score: 60, label: "Fair", desc: "สื่อสารรู้เรื่องแต่ขาดความมั่นใจ หรือต้องให้ลูกค้าถามซ้ำในบางจุด" },
        { score: 40, label: "Needs Help", desc: "สื่อสารไม่ครบถ้วน ข้ามขั้นตอนสำคัญในการอธิบายระบบ" },
        { score: 20, label: "Critical", desc: "ข้อมูลผิดพลาดร้ายแรง จนลูกค้าสับสนหรือระบบใช้งานไม่ได้" }
      ]
    },
    {
      id: 'scoreB',
      title: "Setup Speed & SLA Compliance",
      options: [
        { score: 100, label: "Fast-Track", desc: "ขึ้นระบบเสร็จก่อน SLA กำหนด (เช่น เสร็จใน 5 วัน จากเป้า 10 วัน)" },
        { score: 80, label: "On Target", desc: "ทำตาม Timeline ที่วางไว้เป๊ะ ไม่มีการดีเลย์" },
        { score: 60, label: "Minor Delay", desc: "ล่าช้าเล็กน้อย 1-2 วัน แต่มีการแจ้ง Progress ให้ทราบล่วงหน้า" },
        { score: 40, label: "Lagging", desc: "ดีเลย์เกินกำหนดโดยไม่มีเหตุผลอันควร หรือไม่แจ้งความคืบหน้า" },
        { score: 20, label: "Stalled", desc: "งานค้างนานจนลูกค้าตาม หรือลืมอัปเดตงานนานเกิน 1 สัปดาห์" }
      ]
    },
    {
      id: 'scoreC',
      title: "SOP & Onboarding Quality",
      options: [
        { score: 100, label: "Flawless", desc: "Checklist ครบ 100% บันทึก CRM ละเอียด และทดสอบระบบก่อน Live" },
        { score: 80, label: "Solid", desc: "ทำตาม SOP ครบถ้วน ขั้นตอนถูกต้อง บันทึกข้อมูลชัดเจน" },
        { score: 60, label: "Basic", desc: "ข้ามขั้นตอนย่อยบางอย่าง แต่ระบบหลักยังทำงานได้ถูกต้อง" },
        { score: 40, label: "Incomplete", desc: "ลืมบันทึกข้อมูลสำคัญใน CRM หรือข้ามขั้นตอนการทดสอบบางส่วน" },
        { score: 20, label: "Risk prone", desc: "ไม่ทำตามขั้นตอน SOP จนเกิดปัญหาหน้างานหลังจาก Live" }
      ]
    }
  ],
  Maintenance: [
    {
      id: 'scoreA',
      title: "Response Tone & Professionalism",
      options: [
        { score: 100, label: "Empathic", desc: "ใช้น้ำเสียงเห็นใจลูกค้า จัดการอารมณ์ลูกค้าได้ดีเยี่ยม สุภาพมาก" },
        { score: 80, label: "Professional", desc: "ตอบตามมาตรฐานบริษัท สุภาพ และแสดงความเป็นมืออาชีพ" },
        { score: 60, label: "Neutral", desc: "สื่อสารสั้น กระชับ แต่อาจดูแข็ง (Robotic) ไปนิดหน่อย" },
        { score: 40, label: "Brief", desc: "ตอบคำถามสั้นเกินไปจนดูเหมือนไม่เต็มใจให้บริการ" },
        { score: 20, label: "Inappropriate", desc: "ใช้น้ำเสียงประชดประชัน หรือโต้เถียงกับลูกค้าในเคสปัญหา" }
      ]
    },
    {
      id: 'scoreB',
      title: "Resolution & Fix Speed",
      options: [
        { score: 100, label: "Instant Fix", desc: "แก้ปัญหา/อัปเดตเมนูเสร็จทันที หรือภายในไม่กี่นาที" },
        { score: 80, label: "Swift", desc: "แก้ไขได้ภายในระยะเวลาที่กำหนด (SLA ของงาน Support)" },
        { score: 60, label: "Acceptable", desc: "ใช้เวลานานกว่าปกติเล็กน้อยแต่จบงานได้เรียบร้อย" },
        { score: 40, label: "Slow", desc: "งานค้างนานเกิน 1 วันสำหรับเคสง่ายๆ หรือลูกค้าต้องตามซ้ำ" },
        { score: 20, label: "Abandoned", desc: "ดองเคสทิ้งไว้ข้ามวันโดยไม่มีการอัปเดตจนลูกค้าตำหนิ" }
      ]
    },
    {
      id: 'scoreC',
      title: "Accuracy & Data Integrity",
      options: [
        { score: 100, label: "Precision", desc: "ข้อมูลถูกต้อง 100% เช็คซ้ำหลายรอบ บันทึกประวัติละเอียด" },
        { score: 80, label: "Accurate", desc: "แก้ไขข้อมูลได้ถูกต้องตามคำสั่ง ไม่มีความผิดพลาดชัดเจน" },
        { score: 60, label: "Minor Error", desc: "มีจุดผิดเล็กน้อยที่ไม่กระทบระบบหลัก (เช่น สะกดคำผิด)" },
        { score: 40, label: "Careless", desc: "ใส่ข้อมูลผิดบ่อยครั้งจนต้องให้ Manager มาแก้ตามหลัง" },
        { score: 20, label: "Damaging", desc: "แก้ข้อมูลผิดจนระบบลูกค้าเสียหาย หรือปิดการขายไม่ได้" }
      ]
    }
  ],
  SideTask: [
    {
      id: 'scoreA',
      title: "Internal Coordination",
      options: [
        { score: 100, label: "Leader", desc: "ประสานงานดีเยี่ยม รายงานผลชัดเจน ช่วยคนอื่นได้ด้วย" },
        { score: 80, label: "Cooperative", desc: "ทำงานร่วมกับทีมได้ดี สื่อสารเข้าใจง่าย ไม่เกิดการติดขัด" },
        { score: 60, label: "Functional", desc: "ทำงานของตัวเองได้ แต่ไม่ค่อยแชร์ข้อมูลให้ทีมทราบ" },
        { score: 40, label: "Passive", desc: "ต้องให้ตามถามถึงจะอัปเดต สื่อสารภายในไม่ชัดเจน" },
        { score: 20, label: "Isolated", desc: "ไม่สื่อสารกับใครเลย จนงานอื่นได้รับผลกระทบ" }
      ]
    },
    {
      id: 'scoreB',
      title: "Initiative & Proactivity",
      options: [
        { score: 100, label: "Proactive", desc: "เสนอทางเลือกใหม่ๆ หรือทำเกินกว่าที่สั่งเพื่อคุณภาพที่ดีขึ้น" },
        { score: 80, label: "Active", desc: "ทำตามหน้าที่ที่ได้รับมอบหมายอย่างกระตือรือร้น" },
        { score: 60, label: "Reactive", desc: "ทำตามสั่งเท่านั้น ไม่มีความคิดริเริ่มเพิ่มเติม" },
        { score: 40, label: "Reluctant", desc: "ทำแบบขอไปที หรือต้องคอยกระตุ้นบ่อยๆ" },
        { score: 20, label: "Avoidant", desc: "พยายามเลี่ยงงานเสริม หรือทำออกมาแบบไม่มีคุณภาพเลย" }
      ]
    },
    {
      id: 'scoreC',
      title: "Execution Quality",
      options: [
        { score: 100, label: "Gold Standard", desc: "งานเสริมทำออกมาได้คุณภาพเท่ากับงานหลัก สวยงาม ถูกต้อง" },
        { score: 80, label: "Good Quality", desc: "ผลงานดี เป็นที่น่าพอใจ ใช้งานได้จริง" },
        { score: 60, label: "Average", desc: "คุณภาพพอใช้ มีจุดต้องปรับปรุงบ้าง" },
        { score: 40, label: "Sub-par", desc: "ผลลัพธ์ไม่ตรงตามโจทย์ หรือทำลวกๆ" },
        { score: 20, label: "Failing", desc: "งานล้มเหลว หรือต้องเอาไปทำใหม่ทั้งหมด" }
      ]
    }
  ]
};

const EvaluationForm: React.FC<EvaluationFormProps> = ({ onAdd, submissions, projectSLA }) => {
  const [formData, setFormData] = useState({
    staffId: TEAM_MEMBERS[0].id,
    type: 'Project' as 'Project' | 'Maintenance' | 'SideTask',
    subCategory: 'Restaurant' as ProjectSubCategory,
    scoreA: 80,
    scoreB: 80,
    scoreC: 80,
    slaMetCount: 0,
    responseTimeMin: 5,
    projectCount: 0,
    sideTaskPoints: 0,
    incomingCalls: 0,
    outgoingCalls: 0,
    totalChats: 0,
    totalTasks: 0,
    note: '',
    caseRef: '',
    daysToLive: 0,
  });

  const [integratedTestScore, setIntegratedTestScore] = useState<number | undefined>(undefined);

  useEffect(() => {
    const staff = TEAM_MEMBERS.find(m => m.id === formData.staffId);
    if (staff) {
      const staffSubmissions = submissions
        .filter(s => s.staffName === staff.name && s.isGraded)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (staffSubmissions.length > 0) {
        const latest = staffSubmissions[0];
        const scorePct = Math.round(((latest.autoScore + latest.manualScore) / latest.totalPossiblePoints) * 100);
        setIntegratedTestScore(scorePct);
      } else {
        setIntegratedTestScore(undefined);
      }
    }
  }, [formData.staffId, submissions]);

  const activeRubrics = CONTEXT_RUBRICS[formData.type];
  
  // Get Global Total from the App's overview state
  const globalTotal = projectSLA[formData.subCategory.toLowerCase() as keyof typeof projectSLA]?.total || 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = TEAM_MEMBERS.find(m => m.id === formData.staffId);
    
    const hasLowScore = [formData.scoreA, formData.scoreB, formData.scoreC].some(s => s < 70);
    if (hasLowScore && !formData.note && !formData.caseRef) {
      alert("⚠️ กรุณาระบุ 'เหตุผล' หรือ 'เลขเคส' สำหรับคะแนนที่ต่ำกว่าเกณฑ์ครับ");
      return;
    }

    const calculatedSlaPct = globalTotal > 0 ? Math.round((formData.slaMetCount / globalTotal) * 100) : 0;

    const record: EvaluationRecord = {
      id: Math.random().toString(36).substr(2, 9),
      staffId: formData.staffId,
      staffName: staff?.name || 'Unknown',
      date: new Date().toISOString().split('T')[0],
      type: formData.type,
      projectSubCategory: formData.type === 'Project' ? formData.subCategory : undefined,
      communicationScore: formData.scoreA,
      speedScore: formData.scoreB,
      processCompliance: formData.scoreC,
      followUpScore: 80,
      clarityScore: formData.scoreA, 
      onboardingQuality: formData.scoreC,
      
      // Updated quantitative metrics
      slaMetCount: formData.slaMetCount,
      slaTotalBase: globalTotal,
      individualSlaPct: calculatedSlaPct,
      responseTimeMin: formData.responseTimeMin,
      projectCount: formData.projectCount,
      
      latestTestScore: integratedTestScore,
      daysToLive: formData.daysToLive,
      stepsCompleted: formData.scoreC >= 80 ? 10 : 7,
      incomingCalls: formData.incomingCalls,
      outgoingCalls: formData.outgoingCalls,
      totalChats: formData.totalChats,
      totalTasks: formData.totalTasks,
      issuesResolved: formData.type === 'Maintenance' ? 1 : 0,
      customerFeedback: 85,
      sideTaskPoints: formData.type === 'SideTask' ? formData.sideTaskPoints : 0,
      note: `${formData.caseRef ? `[REF: ${formData.caseRef}] ` : ''}${formData.note}`
    };

    onAdd(record);
  };

  return (
    <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100 max-w-5xl mx-auto mb-20 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between mb-12 pb-8 border-b border-slate-50">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-2xl shadow-slate-200">
            <ClipboardCheck size={32} />
          </div>
          <div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Performance Log</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Behavioral Anchored Rating Scales (BARS)</p>
          </div>
        </div>
        {integratedTestScore !== undefined && (
          <div className="flex items-center gap-4 bg-blue-50 px-6 py-4 rounded-3xl border border-blue-100 animate-in fade-in zoom-in duration-500">
            <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><GraduationCap size={20} /></div>
            <div>
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Integrated Test Score</p>
              <p className="text-2xl font-black text-blue-700">{integratedTestScore}%</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <UserCheck size={14} /> Who are you evaluating?
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 font-black text-slate-800 outline-none shadow-sm"
              value={formData.staffId}
              onChange={(e) => setFormData(prev => ({ ...prev, staffId: e.target.value }))}
            >
              {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Target size={14} /> Evaluation Context
            </label>
            <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-200">
              {(['Project', 'Maintenance', 'SideTask'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, type }))}
                  className={`flex-1 py-4 rounded-[1.5rem] text-xs font-black uppercase transition-all ${
                    formData.type === type ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
               Project Group (For SLA Base)
            </label>
            <select 
              className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 font-black text-slate-800 outline-none shadow-sm"
              value={formData.subCategory}
              onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value as ProjectSubCategory }))}
            >
              <option value="Restaurant">Restaurant</option>
              <option value="Massage">Massage</option>
              <option value="AI Receptionist">AI Receptionist</option>
            </select>
          </div>
        </div>

        {/* UPDATED: SLA & Efficiency Metrics Section */}
        <div className="bg-blue-900 rounded-[3rem] p-12 text-white shadow-2xl space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 pointer-events-none"><Rocket size={180}/></div>
          <div className="flex items-center gap-4 border-b border-white/10 pb-6 relative z-10">
            <div className="p-3 bg-blue-600 rounded-2xl"><Sparkles size={24} /></div>
            <div>
              <h4 className="font-black text-xl tracking-tight uppercase">SLA & Efficiency Metrics (Individual)</h4>
              <p className="text-[10px] text-blue-300 font-bold uppercase">Base Total from Overview: {globalTotal}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-300">Project SLA (Met Count)</span>
                <ShieldCheck size={14} className="text-blue-300" />
              </div>
              <input type="number" min="0" className="bg-transparent text-4xl font-black text-white w-full outline-none" value={formData.slaMetCount || ''} onChange={(e) => setFormData({...formData, slaMetCount: parseInt(e.target.value) || 0})} placeholder="0" />
              <p className="text-[9px] text-blue-400 font-black">Calculated: {globalTotal > 0 ? Math.round((formData.slaMetCount/globalTotal)*100) : 0}%</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-300">Avg Response (min)</span>
                <Clock size={14} className="text-blue-300" />
              </div>
              <input type="number" min="0" className="bg-transparent text-4xl font-black text-white w-full outline-none" value={formData.responseTimeMin || ''} onChange={(e) => setFormData({...formData, responseTimeMin: parseInt(e.target.value) || 0})} placeholder="5" />
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-blue-300">Project count</span>
                <Rocket size={14} className="text-blue-300" />
              </div>
              <input type="number" min="0" className="bg-transparent text-4xl font-black text-white w-full outline-none" value={formData.projectCount || ''} onChange={(e) => setFormData({...formData, projectCount: parseInt(e.target.value) || 0})} placeholder="0" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl space-y-10">
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="p-3 bg-indigo-600 rounded-2xl"><BarChart3 size={24} /></div>
            <h4 className="font-black text-xl tracking-tight uppercase">Raw Workload Metrics (Raw)</h4>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
              <span className="text-[10px] font-black uppercase text-indigo-400">Incoming</span>
              <input type="number" className="bg-transparent text-4xl font-black text-white w-full outline-none" value={formData.incomingCalls || ''} onChange={(e) => setFormData({...formData, incomingCalls: parseInt(e.target.value) || 0})} />
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
              <span className="text-[10px] font-black uppercase text-indigo-400">Outgoing</span>
              <input type="number" className="bg-transparent text-4xl font-black text-white w-full outline-none" value={formData.outgoingCalls || ''} onChange={(e) => setFormData({...formData, outgoingCalls: parseInt(e.target.value) || 0})} />
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
              <span className="text-[10px] font-black uppercase text-indigo-400">Chats</span>
              <input type="number" className="bg-transparent text-4xl font-black text-white w-full outline-none" value={formData.totalChats || ''} onChange={(e) => setFormData({...formData, totalChats: parseInt(e.target.value) || 0})} />
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] space-y-4">
              <span className="text-[10px] font-black uppercase text-indigo-400">Tasks</span>
              <input type="number" className="bg-transparent text-4xl font-black text-white w-full outline-none" value={formData.totalTasks || ''} onChange={(e) => setFormData({...formData, totalTasks: parseInt(e.target.value) || 0})} />
            </div>
          </div>
        </div>

        <div className="space-y-20">
          {activeRubrics.map((rubric) => (
            <div key={rubric.id} className="space-y-8">
              <div className="flex justify-between items-center px-4">
                <h4 className="text-2xl font-black text-slate-800">{rubric.title}</h4>
                <div className="px-6 py-2 rounded-2xl text-2xl font-black bg-indigo-50 text-indigo-600">{(formData as any)[rubric.id]}%</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                {rubric.options.map((opt) => (
                  <button
                    key={opt.score}
                    type="button"
                    onClick={() => setFormData({...formData, [rubric.id]: opt.score})}
                    className={`flex flex-col items-center p-6 rounded-[2.5rem] border-2 transition-all ${
                      (formData as any)[rubric.id] === opt.score ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-400'
                    }`}
                  >
                    <span className="text-xl font-black mb-2">{opt.label}</span>
                    <span className="text-[10px] font-bold leading-relaxed">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 space-y-10">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><LinkIcon size={12}/> Ref / Link</label>
                 <input type="text" placeholder="e.g. Case #1234" className="w-full bg-white border border-slate-200 rounded-2xl p-6 font-bold outline-none" value={formData.caseRef} onChange={(e) => setFormData({...formData, caseRef: e.target.value})} />
              </div>
              <div className="md:col-span-2 space-y-4">
                 <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2"><MessageCircle size={12}/> Feedback</label>
                 <textarea rows={3} placeholder="Add specific notes for the staff..." className="w-full bg-white border border-slate-200 rounded-[2rem] p-6 outline-none resize-none" value={formData.note} onChange={(e) => setFormData({...formData, note: e.target.value})} />
              </div>
           </div>
        </div>

        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-10 rounded-[3rem] shadow-2xl transition-all flex items-center justify-center gap-6 text-2xl group active:scale-95">
          <Save size={32} /> Confirm & Save Performance Log
        </button>
      </form>
    </div>
  );
};

export default EvaluationForm;