
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, User, PlusCircle, 
  Target, Zap, Activity, ShieldCheck, 
  Camera, Smile, Timer,
  Lock, LogOut, Database,
  UserRound, ArrowLeftCircle, Menu,
  ArrowRight, ExternalLink, Store, Stethoscope, Bot, Archive, Sparkles,
  GraduationCap, PenTool
} from 'lucide-react';
import { TEAM_MEMBERS, INITIAL_EVALUATIONS } from './constants.tsx';
import { 
  EvaluationRecord, QARecord, ProofRecord, GrowthMetrics, 
  MonthlySnapshotRecord, AssessmentRecord
} from './types.ts';

// Components
import StatCard from './components/StatCard.tsx';
import EvaluationForm from './components/EvaluationForm.tsx';
import SidebarItem from './components/SidebarItem.tsx';
import IndividualDeepDive from './components/IndividualDeepDive.tsx';
import QAChecklist from './components/QAChecklist.tsx';
import ProofVault from './components/ProofVault.tsx';
import MasterRecord from './components/MasterRecord.tsx';
import StaffHub from './components/StaffHub.tsx';
import AssessmentCenter from './components/AssessmentCenter.tsx';
import TakeTest from './components/TakeTest.tsx';
import GradingDesk from './components/GradingDesk.tsx';

const APP_VERSION = "5.3.1-LITE";

const loadState = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const App: React.FC = () => {
  type Tab = 'dashboard' | 'evaluate' | 'individual' | 'qa' | 'proof' | 'masterRecord' | 'publicStaffAnalysis' | 'assessment' | 'grading';
  
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);

  const [selectedStaffId, setSelectedStaffId] = useState<string>(TEAM_MEMBERS[0]?.id || '1');
  const [publicActiveStaffId, setPublicActiveStaffId] = useState<string | null>(null);
  
  // Data States
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>(() => loadState('cs_evaluations_v3', INITIAL_EVALUATIONS));
  const [qaRecords, setQaRecords] = useState<QARecord[]>(() => loadState('cs_qa_records_v1', []));
  const [proofRecords, setProofRecords] = useState<ProofRecord[]>(() => loadState('cs_proof_records_v1', []));
  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshotRecord[]>(() => loadState('cs_monthly_snapshots_v1', []));
  
  const [projectSLA, setProjectSLA] = useState(() => loadState('cs_project_sla_v2', { 
    restaurant: { total: 0, met: 0 }, 
    massage: { total: 0, met: 0 }, 
    ai: { total: 0, met: 0 } 
  }));
  
  const [otherKPIs, setOtherKPIs] = useState(() => loadState('cs_other_kpis_v1', { 
    responseSpeed: { total: 0, met: 0 }, 
    csat: { total: 1, met: 0 } 
  }));

  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics>(() => loadState('cs_growth_metrics_v1', {
    retention: { startCount: 0, cancelledCount: 0 },
    returnRate: { rejoinedCount: 0, totalCount: 0 }
  }));

  const [assessments, setAssessments] = useState<AssessmentRecord[]>(() => loadState('cs_assessments_v1', []));
  const [submissions, setSubmissions] = useState<any[]>(() => loadState('cs_submissions_v1', []));
  const [activeTestId, setActiveTestId] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#import=')) {
      try {
        const encoded = hash.split('=')[1];
        const decoded = JSON.parse(decodeURIComponent(atob(encoded)));
        if (decoded && decoded.id) {
          setActiveTestId(decoded.id);
          // Check if this assessment already exists, if not add it temporarily to local state
          setAssessments(prev => {
            if (prev.find(a => a.id === decoded.id)) return prev;
            return [...prev, decoded];
          });
        }
      } catch (e) {
        console.error("Import error", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cs_evaluations_v3', JSON.stringify(evaluations));
    localStorage.setItem('cs_qa_records_v1', JSON.stringify(qaRecords));
    localStorage.setItem('cs_proof_records_v1', JSON.stringify(proofRecords));
    localStorage.setItem('cs_project_sla_v2', JSON.stringify(projectSLA));
    localStorage.setItem('cs_other_kpis_v1', JSON.stringify(otherKPIs));
    localStorage.setItem('cs_growth_metrics_v1', JSON.stringify(growthMetrics));
    localStorage.setItem('cs_monthly_snapshots_v1', JSON.stringify(monthlySnapshots));
    localStorage.setItem('cs_assessments_v1', JSON.stringify(assessments));
    localStorage.setItem('cs_submissions_v1', JSON.stringify(submissions));
  }, [evaluations, qaRecords, proofRecords, projectSLA, otherKPIs, growthMetrics, monthlySnapshots, assessments, submissions]);

  const handleTabSwitch = (tab: Tab) => {
    const managerTabs: Tab[] = ['evaluate', 'qa', 'individual', 'proof', 'masterRecord', 'assessment', 'grading'];
    if (managerTabs.includes(tab) && !isManager) {
      setPendingTab(tab);
      setShowPasscodeModal(true);
    } else {
      setActiveTab(tab);
      if (tab === 'publicStaffAnalysis') setPublicActiveStaffId(null);
      if (tab !== 'assessment') setActiveTestId(null);
    }
  };

  const handleClearAllData = () => {
    const passcode = prompt("⚠️ ล้างข้อมูลทั้งหมด? ยืนยันรหัส 0000:");
    if (passcode === '0000') {
      localStorage.clear();
      window.location.reload();
    }
  };

  const verifyPasscode = () => {
    if (passcodeInput === '1234') {
      setIsManager(true);
      setShowPasscodeModal(false);
      setPasscodeInput('');
      if (pendingTab) setActiveTab(pendingTab);
      setPendingTab(null);
    } else {
      alert("รหัสผ่านไม่ถูกต้อง!");
      setPasscodeInput('');
    }
  };

  const teamPerformanceData = useMemo(() => {
    return TEAM_MEMBERS.map(member => {
      const scores: number[] = [];
      const mEvals = evaluations.filter(e => e.staffId === member.id);
      if (mEvals.length > 0) {
        scores.push(mEvals.reduce((a, b) => {
          const evalScore = (b.communicationScore + b.speedScore + b.processCompliance) / 3;
          return a + evalScore;
        }, 0) / mEvals.length);
      }
      const mQA = qaRecords.filter(r => r.staffId === member.id);
      if (mQA.length > 0) {
        scores.push(mQA.reduce((a, b) => a + b.overallPercentage, 0) / mQA.length);
      }
      const score = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { id: member.id, name: member.name, score };
    }).sort((a, b) => b.score - a.score);
  }, [evaluations, qaRecords]);

  const globalStats = useMemo(() => {
    const rPct = projectSLA.restaurant.total > 0 ? (projectSLA.restaurant.met / projectSLA.restaurant.total) * 100 : 0;
    const mPct = projectSLA.massage.total > 0 ? (projectSLA.massage.met / projectSLA.massage.total) * 100 : 0;
    const aPct = projectSLA.ai.total > 0 ? (projectSLA.ai.met / projectSLA.ai.total) * 100 : 0;
    
    const totalMet = projectSLA.restaurant.met + projectSLA.massage.met + projectSLA.ai.met;
    const totalPossible = projectSLA.restaurant.total + projectSLA.massage.total + projectSLA.ai.total;
    const overallSlaPct = totalPossible > 0 ? Math.round((totalMet / totalPossible) * 100) : 0;
    
    const csatAvg = Number(otherKPIs.csat.met) || 0;
    const avgMinutes = otherKPIs.responseSpeed.met;
    
    const teamAvg = (evaluations.length > 0 && teamPerformanceData.length > 0) 
      ? teamPerformanceData.reduce((a, b) => a + b.score, 0) / teamPerformanceData.length 
      : 0;

    const globalQaAvg = qaRecords.length > 0
      ? Math.round(qaRecords.reduce((a, b) => a + b.overallPercentage, 0) / qaRecords.length)
      : 0;

    const overall = Math.round((teamAvg + (csatAvg/5*100) + overallSlaPct + globalQaAvg) / 4);

    return { 
      overallPerf: isNaN(overall) ? 0 : overall, 
      overallSla: overallSlaPct, 
      csatAvg: csatAvg,
      avgSpeed: avgMinutes,
      rPct, mPct, aPct
    };
  }, [evaluations, projectSLA, otherKPIs, teamPerformanceData, qaRecords]);

  const saveMonthlySnapshot = () => {
    const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const confirmSave = confirm(`บันทึก Snapshot สำหรับเดือน ${monthYear} ลงใน Master Record?\nข้อมูล SLA และ KPI ทั้งหมดจะถูกเก็บเป็นประวัติครับ`);
    if (!confirmSave) return;

    const newSnapshot: MonthlySnapshotRecord = {
      id: `snapshot-${Date.now()}`,
      type: 'monthly_snapshot',
      date: new Date().toISOString().split('T')[0],
      monthYear,
      projectSLA: JSON.parse(JSON.stringify(projectSLA)),
      otherKPIs: JSON.parse(JSON.stringify(otherKPIs)),
      growthMetrics: JSON.parse(JSON.stringify(growthMetrics)),
      overallScore: globalStats.overallPerf
    };

    setMonthlySnapshots([...monthlySnapshots, newSnapshot]);
    alert("🚀 บันทึกข้อมูลเดือนนี้ลง Master Record สำเร็จ!");
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 h-full transition-all duration-300 flex flex-col shadow-2xl z-50`}>
        <div className="p-6 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Zap size={20} />
          </div>
          {isSidebarOpen && <h1 className="font-black text-white text-lg tracking-tight">CS PORTAL <span className="text-[10px] text-blue-400 block -mt-1">V {APP_VERSION}</span></h1>}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} active={activeTab === 'dashboard'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('dashboard')} />
          
          <button 
            onClick={() => window.open('https://task-time-calculation.vercel.app/', '_blank')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group text-slate-400 hover:bg-indigo-600/20 hover:text-white ${!isSidebarOpen ? 'justify-center' : ''}`}
          >
            <div className="flex items-center gap-3">
              <Timer size={20} className="text-indigo-400 group-hover:text-white" />
              {isSidebarOpen && <span className="font-bold text-sm tracking-tight">Task Calculator</span>}
            </div>
            {isSidebarOpen && <ExternalLink size={12} className="opacity-40 group-hover:opacity-100" />}
          </button>

          <SidebarItem id="publicStaffAnalysis" label="Personal Insight" icon={UserRound} active={activeTab === 'publicStaffAnalysis'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('publicStaffAnalysis')} />
          
          <div className="pt-6 pb-2">
            {isSidebarOpen && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Management</p>}
            <SidebarItem id="evaluate" label="Performance Log" icon={PlusCircle} active={activeTab === 'evaluate'} collapsed={!isSidebarOpen} isLocked={!isManager} onClick={() => handleTabSwitch('evaluate')} />
            <SidebarItem id="qa" label="QA Audit" icon={ShieldCheck} active={activeTab === 'qa'} collapsed={!isSidebarOpen} isLocked={!isManager} onClick={() => handleTabSwitch('qa')} />
            <SidebarItem id="assessment" label="Assessment Center" icon={GraduationCap} active={activeTab === 'assessment'} collapsed={!isSidebarOpen} isLocked={!isManager} onClick={() => handleTabSwitch('assessment')} />
            <SidebarItem id="grading" label="Grading Desk" icon={PenTool} active={activeTab === 'grading'} collapsed={!isSidebarOpen} isLocked={!isManager} onClick={() => handleTabSwitch('grading')} />
            <SidebarItem id="individual" label="Deep Dive" icon={User} active={activeTab === 'individual'} collapsed={!isSidebarOpen} isLocked={!isManager} onClick={() => handleTabSwitch('individual')} />
            <SidebarItem id="proof" label="Proof Vault" icon={Camera} active={activeTab === 'proof'} collapsed={!isSidebarOpen} isLocked={!isManager} onClick={() => handleTabSwitch('proof')} />
            <SidebarItem id="masterRecord" label="Master Record" icon={Database} active={activeTab === 'masterRecord'} collapsed={!isSidebarOpen} isLocked={!isManager} onClick={() => handleTabSwitch('masterRecord')} />
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
           <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 transition-colors">
              <Menu size={20} />
              {isSidebarOpen && <span className="text-sm font-bold">Collapse Sidebar</span>}
           </button>
           {isManager && (
             <button onClick={() => setIsManager(false)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors mt-2">
                <LogOut size={20} />
                {isSidebarOpen && <span className="text-sm font-bold">Lock Console</span>}
             </button>
           )}
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar relative">
        <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md px-10 py-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{activeTab.replace(/([A-Z])/g, ' $1')}</h2>
              {activeTab === 'dashboard' && <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full border border-emerald-100 uppercase tracking-widest">Live Sync</span>}
           </div>
           {activeTab === 'dashboard' && !isManager && (
             <button onClick={() => { setPendingTab('dashboard'); setShowPasscodeModal(true); }} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                <Lock size={14} /> Unlock Manager Mode
             </button>
           )}
        </header>

        <div className="px-10 pb-20">
           {activeTab === 'dashboard' && (
             <div className="space-y-12">
                {/* Top Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                   <StatCard label="Overall Index" value={`${globalStats.overallPerf}%`} sub="GLOBAL WEIGHTED AVG" icon={Activity} color="indigo" />
                   <StatCard label="Team QA Avg" value={`${Math.round(qaRecords.reduce((a,b)=>a+b.overallPercentage,0)/(qaRecords.length||1))}%`} sub="QUALITY CONSISTENCY" icon={ShieldCheck} color="blue" />
                   <StatCard label="Project SLA" value={`${globalStats.overallSla}%`} sub="RESTAURANT ≤10D | MASSAGE ≤15D" icon={Target} color="orange" />
                   <StatCard label="Retention" value={`${growthMetrics.retention.startCount > 0 ? Math.round(((growthMetrics.retention.startCount - growthMetrics.retention.cancelledCount) / growthMetrics.retention.startCount) * 100) : 0}%`} sub="CUSTOMER LOYALTY" icon={User} color="purple" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <StatCard label="Return Rate" value={`${growthMetrics.returnRate.totalCount > 0 ? Math.round((growthMetrics.returnRate.rejoinedCount / growthMetrics.returnRate.totalCount) * 100) : 0}%`} sub="REPEAT BUSINESS" icon={Zap} color="orange" />
                  <StatCard label="CSAT Index" value={`${globalStats.csatAvg.toFixed(1)}/5`} sub="SATISFACTION INDEX" icon={Smile} color="emerald" />
                  <StatCard label="Avg Response" value={`${globalStats.avgSpeed} min`} sub="DAILY OPERATIONAL SPEED" icon={Timer} color="purple" />
                </div>

                {/* Project SLA Status Section (Restored from Image) */}
                <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-10">
                   <div className="flex items-center justify-between">
                      <div>
                         <h3 className="text-4xl font-black text-slate-800 tracking-tight">Project SLA Status</h3>
                         <p className="text-slate-400 font-bold text-sm mt-1">Real-time status of current building SLA</p>
                      </div>
                      <div className="flex items-center gap-6">
                        {isManager && (
                          <button 
                            onClick={saveMonthlySnapshot} 
                            className="bg-blue-600 text-white flex items-center justify-center p-4 rounded-3xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all group"
                            title="บันทึกข้อมูลเดือนนี้ลง Master Record"
                          >
                             <Sparkles size={28} className="group-hover:scale-110 transition-transform" />
                          </button>
                        )}
                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-100">
                           <div className="text-right">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Met</p>
                              <p className="text-3xl font-black text-blue-600">{globalStats.overallSla}%</p>
                           </div>
                           <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Zap size={24} /></div>
                        </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Restaurant Card */}
                      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 group hover:border-blue-200 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-[1.5rem] flex items-center justify-center"><Store size={28} /></div>
                            <h4 className="font-black text-slate-800 text-xl">Restaurant</h4>
                         </div>
                         <div className="text-6xl font-black text-slate-900 tracking-tighter">{Math.round(globalStats.rPct)}%</div>
                         <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</label>
                               <input type="number" value={projectSLA.restaurant.total} onChange={(e) => setProjectSLA({...projectSLA, restaurant: {...projectSLA.restaurant, total: parseInt(e.target.value)||0}})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-blue-600 outline-none focus:bg-white" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Met</label>
                               <input type="number" value={projectSLA.restaurant.met} onChange={(e) => setProjectSLA({...projectSLA, restaurant: {...projectSLA.restaurant, met: parseInt(e.target.value)||0}})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-blue-600 outline-none focus:bg-white" />
                            </div>
                         </div>
                      </div>

                      {/* Massage Card */}
                      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 group hover:border-blue-200 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-[1.5rem] flex items-center justify-center"><Stethoscope size={28} /></div>
                            <h4 className="font-black text-slate-800 text-xl">Massage</h4>
                         </div>
                         <div className="text-6xl font-black text-slate-900 tracking-tighter">{Math.round(globalStats.mPct)}%</div>
                         <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</label>
                               <input type="number" value={projectSLA.massage.total} onChange={(e) => setProjectSLA({...projectSLA, massage: {...projectSLA.massage, total: parseInt(e.target.value)||0}})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-blue-600 outline-none focus:bg-white" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Met</label>
                               <input type="number" value={projectSLA.massage.met} onChange={(e) => setProjectSLA({...projectSLA, massage: {...projectSLA.massage, met: parseInt(e.target.value)||0}})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-blue-600 outline-none focus:bg-white" />
                            </div>
                         </div>
                      </div>

                      {/* AI Card */}
                      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8 group hover:border-blue-200 transition-all">
                         <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-[1.5rem] flex items-center justify-center"><Bot size={28} /></div>
                            <h4 className="font-black text-slate-800 text-xl">AI Receptionist</h4>
                         </div>
                         <div className="text-6xl font-black text-slate-900 tracking-tighter">{Math.round(globalStats.aPct)}%</div>
                         <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-8">
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</label>
                               <input type="number" value={projectSLA.ai.total} onChange={(e) => setProjectSLA({...projectSLA, ai: {...projectSLA.ai, total: parseInt(e.target.value)||0}})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-blue-600 outline-none focus:bg-white" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Met</label>
                               <input type="number" value={projectSLA.ai.met} onChange={(e) => setProjectSLA({...projectSLA, ai: {...projectSLA.ai, met: parseInt(e.target.value)||0}})} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 font-black text-blue-600 outline-none focus:bg-white" />
                            </div>
                         </div>
                      </div>
                   </div>

                   {/* Other Live KPI Inputs */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-slate-50">
                      <div className="space-y-6">
                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Smile size={14}/> Satisfaction & Speed</h5>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="bg-slate-50 p-6 rounded-3xl">
                              <label className="text-[10px] font-black text-slate-400 uppercase block mb-3">Avg Response (Min)</label>
                              <input type="number" value={otherKPIs.responseSpeed.met} onChange={(e) => setOtherKPIs({...otherKPIs, responseSpeed: {...otherKPIs.responseSpeed, met: parseInt(e.target.value)||0}})} className="w-full bg-white border border-slate-100 p-4 rounded-xl font-black text-2xl outline-none" />
                           </div>
                           <div className="bg-slate-50 p-6 rounded-3xl">
                              <label className="text-[10px] font-black text-slate-400 uppercase block mb-3">CSAT Score (0-5)</label>
                              <input type="number" step="0.1" max="5" value={otherKPIs.csat.met} onChange={(e) => setOtherKPIs({...otherKPIs, csat: {...otherKPIs.csat, met: parseFloat(e.target.value)||0}})} className="w-full bg-white border border-slate-100 p-4 rounded-xl font-black text-2xl outline-none" />
                           </div>
                        </div>
                      </div>
                       <div className="space-y-6">
                        <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><User size={14}/> Growth Stats</h5>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="bg-slate-50 p-6 rounded-3xl">
                              <label className="text-[10px] font-black text-slate-400 uppercase block mb-3">Retention ((Start-Cancel)/Start)</label>
                              <div className="flex gap-2">
                                <input type="number" placeholder="Start" value={growthMetrics.retention.startCount} onChange={(e) => setGrowthMetrics({...growthMetrics, retention: {...growthMetrics.retention, startCount: parseInt(e.target.value)||0}})} className="w-full bg-white border border-slate-100 p-4 rounded-xl font-black text-sm outline-none" />
                                <input type="number" placeholder="Cancel" value={growthMetrics.retention.cancelledCount} onChange={(e) => setGrowthMetrics({...growthMetrics, retention: {...growthMetrics.retention, cancelledCount: parseInt(e.target.value)||0}})} className="w-full bg-white border border-slate-100 p-4 rounded-xl font-black text-sm outline-none" />
                              </div>
                           </div>
                           <div className="bg-slate-50 p-6 rounded-3xl">
                              <label className="text-[10px] font-black text-slate-400 uppercase block mb-3">Return (Rejoin/Total)</label>
                              <div className="flex gap-2">
                                <input type="number" placeholder="Rejoin" value={growthMetrics.returnRate.rejoinedCount} onChange={(e) => setGrowthMetrics({...growthMetrics, returnRate: {...growthMetrics.returnRate, rejoinedCount: parseInt(e.target.value)||0}})} className="w-full bg-white border border-slate-100 p-4 rounded-xl font-black text-sm outline-none" />
                                <input type="number" placeholder="Total" value={growthMetrics.returnRate.totalCount} onChange={(e) => setGrowthMetrics({...growthMetrics, returnRate: {...growthMetrics.returnRate, totalCount: parseInt(e.target.value)||0}})} className="w-full bg-white border border-slate-100 p-4 rounded-xl font-black text-sm outline-none" />
                              </div>
                           </div>
                        </div>
                      </div>
                   </div>
                   {isManager && (
                     <div className="pt-6 flex justify-center">
                        <button onClick={saveMonthlySnapshot} className="flex items-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95">
                           <Archive size={20} /> Archive Complete Snapshot
                        </button>
                     </div>
                   )}
                </div>

                <StaffHub teamPerformance={teamPerformanceData} evaluations={evaluations} qaRecords={qaRecords} />
             </div>
           )}

           {activeTab === 'publicStaffAnalysis' && (
             <div className="space-y-10">
                {!publicActiveStaffId ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {TEAM_MEMBERS.map(m => (
                      <button key={m.id} onClick={() => setPublicActiveStaffId(m.id)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left group">
                         <div className="flex items-center gap-4">
                           <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-blue-600 transition-colors">{m.name.charAt(0)}</div>
                           <div>
                             <h4 className="font-black text-slate-800 text-xl">{m.name}</h4>
                             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{m.role}</p>
                           </div>
                         </div>
                         <div className="mt-6 flex items-center justify-between text-[10px] font-black text-blue-500 uppercase tracking-widest border-t border-slate-50 pt-6">
                            View Personal Data Vault <ArrowRight size={14} />
                         </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div>
                    <button onClick={() => setPublicActiveStaffId(null)} className="mb-8 flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                      <ArrowLeftCircle size={16} /> กลับหน้าเลือกรายชื่อ
                    </button>
                    <IndividualDeepDive staffId={publicActiveStaffId} evaluations={evaluations} proofs={proofRecords} peerReviews={[]} qaRecords={qaRecords} onStaffChange={() => {}} mode="public" />
                  </div>
                )}
             </div>
           )}

           {activeTab === 'evaluate' && <EvaluationForm onAdd={(recs) => setEvaluations([...evaluations, ...recs])} projectSLA={projectSLA} />}
           {activeTab === 'qa' && <QAChecklist onSave={(rec) => setQaRecords([...qaRecords, rec])} />}
           {activeTab === 'assessment' && (
             activeTestId ? (
               <TakeTest 
                 test={assessments.find(a => a.id === activeTestId)} 
                 submissions={submissions} 
                 onSubmit={(s) => setSubmissions([...submissions, s])} 
               />
             ) : (
               <AssessmentCenter 
                 assessments={assessments} 
                 onSave={(rec) => setAssessments(prev => {
                   const exists = prev.find(a => a.id === rec.id);
                   if (exists) return prev.map(a => a.id === rec.id ? rec : a);
                   return [...prev, rec];
                 })}
                 onTakeTest={(id) => setActiveTestId(id)}
                 onDelete={(id) => setAssessments(assessments.filter(a => a.id !== id))}
               />
             )
           )}
           {activeTab === 'grading' && (
             <GradingDesk 
               submissions={submissions} 
               assessments={assessments} 
               onUpdate={(updated) => setSubmissions(submissions.map(s => s.id === updated.id ? updated : s))} 
             />
           )}
           {activeTab === 'individual' && <IndividualDeepDive staffId={selectedStaffId} evaluations={evaluations} proofs={proofRecords} peerReviews={[]} qaRecords={qaRecords} onStaffChange={setSelectedStaffId} />}
           {activeTab === 'proof' && <ProofVault proofs={proofRecords} onAdd={(p) => setProofRecords([...proofRecords, p])} onDelete={(id) => setProofRecords(proofRecords.filter(p => p.id !== id))} />}
           {activeTab === 'masterRecord' && <MasterRecord evaluations={evaluations} qaRecords={qaRecords} monthlySnapshots={monthlySnapshots} onClearAll={handleClearAllData} />}
        </div>
      </main>

      {showPasscodeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-sm text-center space-y-8 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl">
                 <Lock size={32} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-slate-900 uppercase">Manager Access</h3>
                 <p className="text-slate-400 font-bold text-sm">กรุณาใส่รหัสผ่านเพื่อเข้าใช้งานพื้นที่ควบคุม</p>
              </div>
              <div className="space-y-4">
                 <input type="password" value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyPasscode()} placeholder="••••" className="w-full text-center bg-slate-50 border border-slate-200 p-5 rounded-2xl font-black text-3xl outline-none" />
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => { setShowPasscodeModal(false); setPendingTab(null); setPasscodeInput(''); }} className="py-4 bg-slate-100 text-slate-400 rounded-2xl font-black uppercase text-xs">Cancel</button>
                    <button onClick={verifyPasscode} className="py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-blue-500/20">Authorize</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
