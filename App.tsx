
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, Users, User, PlusCircle, Clock, 
  CheckCircle2, Target, ClipboardList, Store, Sparkles, 
  Zap, Save, FileText, Activity, ShieldCheck, 
  FileSearch, ChevronDown, Percent, ArrowLeft, FileCheck, 
  CalendarDays, Trophy, Camera, Smile, Timer, Trash2, Building2,
  Stethoscope, Bot, RefreshCcw, UserMinus, Lock, LogOut, Database,
  UserRound, ArrowLeftCircle, X, Menu
} from 'lucide-react';
import { TEAM_MEMBERS, INITIAL_EVALUATIONS } from './constants.tsx';
import { EvaluationRecord, QARecord, ProofRecord, GrowthMetrics, MonthlySnapshotRecord } from './types.ts';

// Components
import StatCard from './components/StatCard.tsx';
import EvaluationForm from './components/EvaluationForm.tsx';
import SidebarItem from './components/SidebarItem.tsx';
import IndividualDeepDive from './components/IndividualDeepDive.tsx';
import QAChecklist from './components/QAChecklist.tsx';
import StaffHub from './components/StaffHub.tsx';
import ProofVault from './components/ProofVault.tsx';
import MasterRecord from './components/MasterRecord.tsx';

const APP_VERSION = "5.0.0-LITE";

const loadState = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'evaluate' | 'individual' | 'qa' | 'proof' | 'masterRecord' | 'publicStaffAnalysis'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [pendingTab, setPendingTab] = useState<any>(null);

  const [selectedStaffId, setSelectedStaffId] = useState<string>(TEAM_MEMBERS[0]?.id || '1');
  const [publicActiveStaffId, setPublicActiveStaffId] = useState<string | null>(null);
  
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>(() => loadState('cs_evaluations_v3', INITIAL_EVALUATIONS));
  const [qaRecords, setQaRecords] = useState<QARecord[]>(() => loadState('cs_qa_records_v1', []));
  const [proofRecords, setProofRecords] = useState<ProofRecord[]>(() => loadState('cs_proof_records_v1', []));
  const [monthlySnapshots, setMonthlySnapshots] = useState<MonthlySnapshotRecord[]>(() => loadState('cs_monthly_snapshots_v1', []));
  
  const [projectSLA, setProjectSLA] = useState(() => loadState('cs_project_sla_v2', { 
    restaurant: { total: 0, met: 0, target: 10 }, 
    massage: { total: 0, met: 0, target: 15 }, 
    ai: { total: 0, met: 0, target: 3 } 
  }));
  
  const [otherKPIs, setOtherKPIs] = useState(() => loadState('cs_other_kpis_v1', { 
    responseSpeed: { total: 0, met: 0 }, 
    csat: { total: 0, met: 0 } 
  }));

  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics>(() => loadState('cs_growth_metrics_v1', {
    retention: { startCount: 0, endCount: 0, newCount: 0 },
    returnRate: { returningCount: 0, totalCount: 0 }
  }));

  useEffect(() => {
    localStorage.setItem('cs_evaluations_v3', JSON.stringify(evaluations));
    localStorage.setItem('cs_qa_records_v1', JSON.stringify(qaRecords));
    localStorage.setItem('cs_proof_records_v1', JSON.stringify(proofRecords));
    localStorage.setItem('cs_project_sla_v2', JSON.stringify(projectSLA));
    localStorage.setItem('cs_other_kpis_v1', JSON.stringify(otherKPIs));
    localStorage.setItem('cs_growth_metrics_v1', JSON.stringify(growthMetrics));
    localStorage.setItem('cs_monthly_snapshots_v1', JSON.stringify(monthlySnapshots));
  }, [evaluations, qaRecords, proofRecords, projectSLA, otherKPIs, growthMetrics, monthlySnapshots]);

  const handleTabSwitch = (tab: any) => {
    const managerTabs = ['evaluate', 'qa', 'individual', 'proof', 'masterRecord'];
    if (managerTabs.includes(tab) && !isManager) {
      setPendingTab(tab);
      setShowPasscodeModal(true);
    } else {
      setActiveTab(tab);
      if (tab === 'publicStaffAnalysis') setPublicActiveStaffId(null);
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
    const projectSlaTotal = (rPct + mPct + aPct) / 3;
    
    const csatAvg = otherKPIs.csat.met || 0;
    const csatPct = otherKPIs.csat.total > 0 ? (csatAvg / 5) * 100 : 0;
    
    const avgMinutes = otherKPIs.responseSpeed.met;
    const speedScore = otherKPIs.responseSpeed.total > 0 
      ? Math.max(0, Math.min(100, 100 - (avgMinutes - 5) * 10))
      : 0;

    const { retention, returnRate } = growthMetrics;
    const retentionPct = retention.startCount > 0 ? ((retention.endCount - retention.newCount) / retention.startCount) * 100 : 0;
    const returnRatePct = returnRate.totalCount > 0 ? (returnRate.returningCount / returnRate.totalCount) * 100 : 0;
    
    const teamAvg = (evaluations.length > 0 && teamPerformanceData.length > 0) 
      ? teamPerformanceData.reduce((a, b) => a + b.score, 0) / teamPerformanceData.length 
      : 0;

    const globalQaAvg = qaRecords.length > 0
      ? Math.round(qaRecords.reduce((a, b) => a + b.overallPercentage, 0) / qaRecords.length)
      : 0;

    const overall = Math.round((teamAvg + csatPct + speedScore + projectSlaTotal + retentionPct + returnRatePct + globalQaAvg) / 7);

    return { 
      overallPerf: isNaN(overall) ? 0 : overall, 
      overallSla: Math.round(projectSlaTotal), 
      csatPct: Math.round(csatPct), 
      csatAvg: csatAvg,
      avgSpeed: avgMinutes,
      retentionPct: Math.max(0, Math.round(retentionPct)),
      returnRatePct: Math.round(returnRatePct),
      globalQaAvg,
      rPct: Math.round(rPct), 
      mPct: Math.round(mPct), 
      aPct: Math.round(aPct)
    };
  }, [projectSLA, otherKPIs, growthMetrics, teamPerformanceData, evaluations, qaRecords]);

  const updateProjectMetric = (project: keyof typeof projectSLA, field: 'total' | 'met', val: number) => {
    setProjectSLA(prev => ({
      ...prev,
      [project]: { ...prev[project], [field]: val }
    }));
  };

  const updateOtherKPI = (kpi: keyof typeof otherKPIs, val: number) => {
    setOtherKPIs(prev => ({
      ...prev,
      [kpi]: { total: 1, met: val }
    }));
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {showPasscodeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-sm w-full text-center space-y-8">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-xl"><Lock size={40} /></div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900">Manager Access</h3>
              <p className="text-slate-400 font-bold text-sm">กรุณากรอกรหัสผ่านเพื่อเข้าสู่โหมดจัดการ</p>
            </div>
            <input 
              autoFocus type="password" maxLength={4} value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyPasscode()}
              placeholder="● ● ● ●"
              className="w-full text-center text-3xl font-black tracking-[1em] p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-500"
            />
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowPasscodeModal(false)} className="py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">Cancel</button>
              <button onClick={verifyPasscode} className="py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg">Verify</button>
            </div>
          </div>
        </div>
      )}

      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 transition-all duration-300 flex flex-col z-50 shadow-2xl`}>
        <div className="p-6 flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg"><Target className="text-white" size={24} /></div>
          {isSidebarOpen && <h1 className="text-white font-black text-lg tracking-tight">CS Portal</h1>}
        </div>
        <nav className="flex-1 mt-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {isSidebarOpen && <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 ml-4">Public Area</p>}
            <SidebarItem id="dashboard" label="Dashboard" icon={LayoutDashboard} active={activeTab === 'dashboard'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('dashboard')} />
            <SidebarItem id="publicStaffAnalysis" label="My Performance" icon={UserRound} active={activeTab === 'publicStaffAnalysis'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('publicStaffAnalysis')} />
          </div>
          <div className="h-px bg-slate-800/50 mx-4 my-4"></div>
          <div className="space-y-1">
            {isSidebarOpen && <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 ml-4">Management</p>}
            <SidebarItem id="masterRecord" label="Master Record" icon={Database} active={activeTab === 'masterRecord'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('masterRecord')} isLocked={!isManager} />
            <SidebarItem id="evaluate" label="Performance Log" icon={PlusCircle} active={activeTab === 'evaluate'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('evaluate')} isLocked={!isManager} />
            <SidebarItem id="qa" label="QA Checks" icon={FileSearch} active={activeTab === 'qa'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('qa')} isLocked={!isManager} />
            <SidebarItem id="individual" label="Staff Analytics" icon={User} active={activeTab === 'individual'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('individual')} isLocked={!isManager} />
            <SidebarItem id="proof" label="Proof Vault" icon={Camera} active={activeTab === 'proof'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('proof')} isLocked={!isManager} />
          </div>
        </nav>
        <div className="p-4 border-t border-slate-800 space-y-2">
          {isSidebarOpen && <p className="text-[9px] font-black text-slate-700 text-center uppercase mb-2">Build {APP_VERSION}</p>}
          {isManager && isSidebarOpen && (
            <button onClick={() => setIsManager(false)} className="w-full flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest">
              <LogOut size={16} /> Logout Manager
            </button>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all">
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-3">
            <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${isManager ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {isManager ? 'Manager Mode' : 'View Only'}
            </span>
            <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4">
            {!isManager && <button onClick={() => setShowPasscodeModal(true)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black shadow-lg"><Lock size={14} /> Unlock Manager</button>}
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shadow-lg transition-all ${isManager ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
              {isManager ? 'ADM' : 'GST'}
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto w-full pb-32">
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard label="Overall Index" value={`${globalStats.overallPerf}%`} sub="Global Weighted Avg" icon={Activity} color="blue" />
                <StatCard label="Team QA Avg" value={`${globalStats.globalQaAvg}%`} sub="Quality Consistency" icon={FileSearch} color="indigo" />
                <StatCard label="Project SLA" value={`${globalStats.overallSla}%`} sub="Building Volume Met" icon={Zap} color="orange" />
                <StatCard label="Retention" value={`${globalStats.retentionPct}%`} sub="Customer Loyalty" icon={UserMinus} color="purple" />
                <StatCard label="Return Rate" value={`${globalStats.returnRatePct}%`} sub="Repeat Business" icon={RefreshCcw} color="orange" />
                <StatCard label="CSAT Index" value={`${globalStats.csatAvg.toFixed(1)} / 5`} sub="Satisfaction Index" icon={Smile} color="emerald" />
                <StatCard label="Avg Response" value={`${globalStats.avgSpeed} min`} sub="Daily Operational Speed" icon={Clock} color="purple" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
                <div className="lg:col-span-3 space-y-10">
                  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start mb-10">
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Project SLA Status</h3>
                        <p className="text-slate-400 font-bold text-sm">Real-time status of current building SLA</p>
                      </div>
                      <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 rounded-3xl border border-slate-100">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall Met</p>
                          <p className="text-2xl font-black text-blue-600">{globalStats.overallSla}%</p>
                        </div>
                        <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg"><Sparkles size={20} /></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 space-y-6 group hover:bg-white hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-rose-50 text-rose-500 rounded-[2rem] shadow-sm"><Store size={24} /></div>
                          <h4 className="font-black text-slate-700">Restaurant</h4>
                        </div>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">{globalStats.rPct}%</p>
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                          {isManager ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</label>
                                <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs font-black outline-none" value={projectSLA.restaurant.total} onChange={(e) => updateProjectMetric('restaurant', 'total', parseInt(e.target.value) || 0)} />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Met</label>
                                <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs font-black outline-none text-blue-600" value={projectSLA.restaurant.met} onChange={(e) => updateProjectMetric('restaurant', 'met', parseInt(e.target.value) || 0)} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">Volume: {projectSLA.restaurant.total}</span>
                              <span className="text-blue-500">Met: {projectSLA.restaurant.met}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 space-y-6 group hover:bg-white hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-emerald-50 text-emerald-500 rounded-[2rem] shadow-sm"><Stethoscope size={24} /></div>
                          <h4 className="font-black text-slate-700">Massage</h4>
                        </div>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">{globalStats.mPct}%</p>
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                          {isManager ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</label>
                                <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs font-black outline-none" value={projectSLA.massage.total} onChange={(e) => updateProjectMetric('massage', 'total', parseInt(e.target.value) || 0)} />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Met</label>
                                <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs font-black outline-none text-blue-600" value={projectSLA.massage.met} onChange={(e) => updateProjectMetric('massage', 'met', parseInt(e.target.value) || 0)} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">Volume: {projectSLA.massage.total}</span>
                              <span className="text-blue-500">Met: {projectSLA.massage.met}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100 space-y-6 group hover:bg-white hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="p-4 bg-blue-50 text-blue-500 rounded-[2rem] shadow-sm"><Bot size={24} /></div>
                          <h4 className="font-black text-slate-700 leading-tight">AI<br/>Receptionist</h4>
                        </div>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">{globalStats.aPct}%</p>
                        <div className="space-y-4 pt-2 border-t border-slate-100">
                          {isManager ? (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</label>
                                <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs font-black outline-none" value={projectSLA.ai.total} onChange={(e) => updateProjectMetric('ai', 'total', parseInt(e.target.value) || 0)} />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Met</label>
                                <input type="number" className="w-full bg-white border border-slate-200 rounded-lg p-1 text-xs font-black outline-none text-blue-600" value={projectSLA.ai.met} onChange={(e) => updateProjectMetric('ai', 'met', parseInt(e.target.value) || 0)} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">Volume: {projectSLA.ai.total}</span>
                              <span className="text-blue-500">Met: {projectSLA.ai.met}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evaluate' && <EvaluationForm projectSLA={projectSLA} submissions={[]} onAdd={(records) => { setEvaluations([...evaluations, ...records]); setActiveTab('dashboard'); }} />}
          {activeTab === 'qa' && <QAChecklist onSave={(r) => { setQaRecords([...qaRecords, r]); setActiveTab('dashboard'); }} />}
          {activeTab === 'proof' && <ProofVault proofs={proofRecords} onAdd={(p) => setProofRecords([p, ...proofRecords])} onDelete={(id) => setProofRecords(proofRecords.filter(p => p.id !== id))} />}
          {activeTab === 'masterRecord' && <MasterRecord evaluations={evaluations} qaRecords={qaRecords} submissions={[]} assessments={[]} monthlySnapshots={monthlySnapshots} onClearAll={handleClearAllData} />}
          
          {activeTab === 'publicStaffAnalysis' && !publicActiveStaffId && (
            <div className="space-y-12 animate-in fade-in duration-500">
              <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-indigo-600 text-white rounded-[2rem] shadow-xl"><Users size={32} /></div>
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Staff Directory</h3>
                    <p className="text-slate-400 font-bold text-sm">เลือกสมาชิกในทีมเพื่อดูข้อมูลประสิทธิภาพรายบุคคล</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {TEAM_MEMBERS.map(member => (
                  <button key={member.id} onClick={() => setPublicActiveStaffId(member.id)} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6 group">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center text-3xl font-black group-hover:bg-blue-600 transition-colors">{member.name.substring(0, 2).toUpperCase()}</div>
                    <div>
                      <h4 className="text-xl font-black text-slate-900">{member.name}</h4>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{member.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'individual' || (activeTab === 'publicStaffAnalysis' && publicActiveStaffId)) && (
            <div className="space-y-6">
              <button onClick={() => { if (activeTab === 'publicStaffAnalysis') setPublicActiveStaffId(null); }} className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest transition-all mb-4"><ArrowLeftCircle size={16} /> Back</button>
              <IndividualDeepDive staffId={activeTab === 'publicStaffAnalysis' ? publicActiveStaffId! : selectedStaffId} evaluations={evaluations} proofs={proofRecords} peerReviews={[]} submissions={[]} qaRecords={qaRecords} onStaffChange={setSelectedStaffId} mode={activeTab === 'publicStaffAnalysis' ? 'public' : 'manager'} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
