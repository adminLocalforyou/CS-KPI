import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, Users, User, PlusCircle, TrendingUp, Clock, MessageSquare, 
  CheckCircle2, ChevronRight, Menu, X, Target, ClipboardList, Store, Sparkles, 
  Zap, Calculator, Save, FileText, BarChart3, Activity, Info, ShieldCheck, 
  FileSearch, GraduationCap, Award, ChevronDown, Percent, ArrowLeft, FileCheck, 
  CalendarDays, ListFilter, Trophy, LayoutGrid, Camera, HeartHandshake, 
  ExternalLink, Search, LineChart, UserPlus, Smile, Timer, Trash2, Building2,
  Stethoscope, Bot, RefreshCcw, UserMinus, Lock, LogOut, PenTool, Database
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell
} from 'recharts';
import { TEAM_MEMBERS, INITIAL_EVALUATIONS } from './constants.tsx';
import { EvaluationRecord, QARecord, TestSubmission, ProofRecord, PeerReviewRecord, GrowthMetrics, AssessmentRecord } from './types.ts';

// Components
import StatCard from './components/StatCard.tsx';
import EvaluationForm from './components/EvaluationForm.tsx';
import SidebarItem from './components/SidebarItem.tsx';
import IndividualDeepDive from './components/IndividualDeepDive.tsx';
import QAChecklist from './components/QAChecklist.tsx';
import TeamAnalysis from './components/TeamAnalysis.tsx';
import StaffHub from './components/StaffHub.tsx';
import ProofVault from './components/ProofVault.tsx';
import PeerReviewCollector from './components/PeerReviewCollector.tsx';
import AssessmentCenter from './components/AssessmentCenter.tsx';
import TakeTest from './components/TakeTest.tsx';
import GradingDesk from './components/GradingDesk.tsx';
import MasterRecord from './components/MasterRecord.tsx';

const loadState = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'evaluate' | 'team' | 'individual' | 'qa' | 'staffHub' | 'proof' | 'peerReview' | 'assessment' | 'grading' | 'takeTest' | 'masterRecord'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isManager, setIsManager] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');
  const [pendingTab, setPendingTab] = useState<any>(null);

  const [selectedStaffId, setSelectedStaffId] = useState<string>(TEAM_MEMBERS[0]?.id || '1');
  const [activeTestId, setActiveTestId] = useState<string | null>(null);
  
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>(() => loadState('cs_evaluations_v3', INITIAL_EVALUATIONS));
  const [qaRecords, setQaRecords] = useState<QARecord[]>(() => loadState('cs_qa_records_v1', []));
  const [proofRecords, setProofRecords] = useState<ProofRecord[]>(() => loadState('cs_proof_records_v1', []));
  const [peerReviewRecords, setPeerReviewRecords] = useState<PeerReviewRecord[]>(() => loadState('cs_peer_review_records_v1', []));
  const [assessments, setAssessments] = useState<AssessmentRecord[]>(() => loadState('cs_assessments_v1', []));
  const [testSubmissions, setTestSubmissions] = useState<TestSubmission[]>(() => loadState('cs_submissions_v1', []));
  
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

  // Hash Routing Logic
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#test=')) {
        const testId = hash.replace('#test=', '');
        setActiveTestId(testId);
        setActiveTab('takeTest');
      } else if (hash === '') {
        setActiveTab('dashboard');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    localStorage.setItem('cs_evaluations_v3', JSON.stringify(evaluations));
    localStorage.setItem('cs_qa_records_v1', JSON.stringify(qaRecords));
    localStorage.setItem('cs_proof_records_v1', JSON.stringify(proofRecords));
    localStorage.setItem('cs_peer_review_records_v1', JSON.stringify(peerReviewRecords));
    localStorage.setItem('cs_assessments_v1', JSON.stringify(assessments));
    localStorage.setItem('cs_submissions_v1', JSON.stringify(testSubmissions));
    localStorage.setItem('cs_project_sla_v2', JSON.stringify(projectSLA));
    localStorage.setItem('cs_other_kpis_v1', JSON.stringify(otherKPIs));
    localStorage.setItem('cs_growth_metrics_v1', JSON.stringify(growthMetrics));
  }, [evaluations, qaRecords, proofRecords, peerReviewRecords, assessments, testSubmissions, projectSLA, otherKPIs, growthMetrics]);

  const handleTabSwitch = (tab: any) => {
    const managerTabs = ['evaluate', 'qa', 'individual', 'proof', 'peerReview', 'assessment', 'grading', 'masterRecord'];
    if (managerTabs.includes(tab) && !isManager) {
      setPendingTab(tab);
      setShowPasscodeModal(true);
    } else {
      setActiveTab(tab);
      if (tab !== 'takeTest') window.location.hash = '';
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
        scores.push(mEvals.reduce((a, b) => a + (b.communicationScore + b.speedScore + b.processCompliance) / 3, 0) / mEvals.length);
      }
      const mQA = qaRecords.filter(r => r.staffId === member.id);
      if (mQA.length > 0) {
        scores.push(mQA.reduce((a, b) => a + b.overallPercentage, 0) / mQA.length);
      }
      const mTests = testSubmissions.filter(s => s.staffName === member.name && s.isGraded);
      if (mTests.length > 0) {
        scores.push(mTests.reduce((a, b) => a + ((b.autoScore + b.manualScore) / b.totalPossiblePoints) * 100, 0) / mTests.length);
      }
      const score = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      return { id: member.id, name: member.name, score };
    }).sort((a, b) => b.score - a.score);
  }, [evaluations, qaRecords, testSubmissions]);

  const globalStats = useMemo(() => {
    const rPct = projectSLA.restaurant.total > 0 ? (projectSLA.restaurant.met / projectSLA.restaurant.total) * 100 : 0;
    const mPct = projectSLA.massage.total > 0 ? (projectSLA.massage.met / projectSLA.massage.total) * 100 : 0;
    const aPct = projectSLA.ai.total > 0 ? (projectSLA.ai.met / projectSLA.ai.total) * 100 : 0;
    const projectSlaTotal = (rPct + mPct + aPct) / 3;
    const csatPct = otherKPIs.csat.total > 0 ? (otherKPIs.csat.met / otherKPIs.csat.total) * 100 : 0;
    const speedPct = otherKPIs.responseSpeed.total > 0 ? (otherKPIs.responseSpeed.met / otherKPIs.responseSpeed.total) * 100 : 0;
    const { retention, returnRate } = growthMetrics;
    const retentionPct = retention.startCount > 0 ? ((retention.endCount - retention.newCount) / retention.startCount) * 100 : 0;
    const returnRatePct = returnRate.totalCount > 0 ? (returnRate.returningCount / returnRate.totalCount) * 100 : 0;
    const teamAvg = teamPerformanceData.length > 0 ? teamPerformanceData.reduce((a, b) => a + b.score, 0) / teamPerformanceData.length : 0;

    return { 
      overallPerf: Math.round((teamAvg + csatPct + speedPct + projectSlaTotal + retentionPct + returnRatePct) / 6), 
      overallSla: Math.round(projectSlaTotal), 
      csatPct: Math.round(csatPct), 
      speedPct: Math.round(speedPct),
      retentionPct: Math.max(0, Math.round(retentionPct)),
      returnRatePct: Math.round(returnRatePct),
      rPct: Math.round(rPct), 
      mPct: Math.round(mPct), 
      aPct: Math.round(aPct)
    };
  }, [projectSLA, otherKPIs, growthMetrics, teamPerformanceData]);

  const updateProjectSLA = (category: 'restaurant' | 'massage' | 'ai', field: 'met' | 'total', val: string) => {
    if (!isManager) return;
    setProjectSLA(prev => ({...prev, [category]: {...prev[category], [field]: Math.max(0, parseInt(val) || 0)}}));
  };
  
  const updateOtherKPI = (category: 'responseSpeed' | 'csat', field: 'met' | 'total', val: string) => {
    if (!isManager) return;
    setOtherKPIs(prev => ({...prev, [category]: {...prev[category], [field]: Math.max(0, parseInt(val) || 0)}}));
  };

  const updateGrowthMetric = (category: 'retention' | 'returnRate', field: string, val: string) => {
    if (!isManager) return;
    setGrowthMetrics(prev => ({
      ...prev,
      [category]: {
        ...(prev as any)[category],
        [field]: Math.max(0, parseInt(val) || 0)
      }
    }));
  };

  const handleTakeTest = (testId: string) => {
    setActiveTestId(testId);
    window.location.hash = `test=${testId}`;
  };

  const updateSubmission = (submission: TestSubmission) => {
    setTestSubmissions(prev => {
      const exists = prev.find(s => s.id === submission.id);
      if (exists) {
        return prev.map(s => s.id === submission.id ? submission : s);
      }
      return [submission, ...prev];
    });
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {showPasscodeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md">
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

      {activeTab !== 'takeTest' && (
        <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 transition-all duration-300 ease-in-out flex flex-col z-50 shadow-2xl shadow-black/20`}>
          <div className="p-6 flex items-center gap-4">
            <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20"><Target className="text-white" size={24} /></div>
            {isSidebarOpen && <h1 className="text-white font-black text-lg tracking-tight">CS Portal</h1>}
          </div>
          <nav className="flex-1 mt-6 px-3 space-y-6 overflow-y-auto custom-scrollbar">
            <div className="space-y-1">
              {isSidebarOpen && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-4">Public Space</p>}
              <SidebarItem id="dashboard" label="Overview" icon={LayoutDashboard} active={activeTab === 'dashboard'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('dashboard')} />
              <SidebarItem id="team" label="Team Analysis" icon={TrendingUp} active={activeTab === 'team'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('team')} />
              <SidebarItem id="staffHub" label="Public Hub" icon={Trophy} active={activeTab === 'staffHub'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('staffHub')} />
            </div>
            <div className="h-px bg-slate-800/50 mx-4"></div>
            <div className="space-y-1">
              {isSidebarOpen && <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 ml-4">Manager Deck</p>}
              <SidebarItem id="masterRecord" label="Master Record" icon={Database} active={activeTab === 'masterRecord'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('masterRecord')} isLocked={!isManager} />
              <SidebarItem id="evaluate" label="Performance Log" icon={PlusCircle} active={activeTab === 'evaluate'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('evaluate')} isLocked={!isManager} />
              <SidebarItem id="qa" label="QA Checks" icon={FileSearch} active={activeTab === 'qa'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('qa')} isLocked={!isManager} />
              <SidebarItem id="assessment" label="Assessment Hub" icon={GraduationCap} active={activeTab === 'assessment'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('assessment')} isLocked={!isManager} />
              <SidebarItem id="grading" label="Grading Desk" icon={PenTool} active={activeTab === 'grading'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('grading')} isLocked={!isManager} />
              <SidebarItem id="individual" label="Staff Analytics" icon={User} active={activeTab === 'individual'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('individual')} isLocked={!isManager} />
              <SidebarItem id="proof" label="Proof Vault" icon={Camera} active={activeTab === 'proof'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('proof')} isLocked={!isManager} />
              <SidebarItem id="peerReview" label="Peer Review" icon={HeartHandshake} active={activeTab === 'peerReview'} collapsed={!isSidebarOpen} onClick={() => handleTabSwitch('peerReview')} isLocked={!isManager} />
            </div>
          </nav>
          <div className="p-4 border-t border-slate-800 space-y-2">
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
      )}

      <main className="flex-1 overflow-y-auto relative">
        {activeTab !== 'takeTest' && (
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
        )}

        <div className={activeTab === 'takeTest' ? '' : 'p-8 max-w-7xl mx-auto w-full pb-32'}>
          {activeTab === 'dashboard' && (
            <div className="space-y-12 animate-in fade-in duration-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                <StatCard label="Overall Perf" value={`${globalStats.overallPerf}%`} sub="Global Index" icon={Activity} color="blue" />
                <StatCard label="Retention" value={`${globalStats.retentionPct}%`} sub="Customer Loyalty" icon={UserMinus} color="purple" />
                <StatCard label="Return Rate" value={`${globalStats.returnRatePct}%`} sub="Repeat Business" icon={RefreshCcw} color="orange" />
                <StatCard label="CSAT Index" value={`${globalStats.csatPct}%`} sub="Satisfaction" icon={Smile} color="emerald" />
                <StatCard label="Project SLA" value={`${globalStats.overallSla}%`} sub="Building Met" icon={Zap} color="orange" />
                <StatCard label="Response" value={`${globalStats.speedPct}%`} sub="SLA Timing" icon={Clock} color="purple" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 space-y-10">
                  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none rotate-12"><Building2 size={240} /></div>
                    <div className="relative z-10 flex items-center justify-between gap-6">
                      <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Project SLA Status</h3>
                        <p className="text-slate-400 font-bold text-sm">Real-time status of current building SLA</p>
                      </div>
                      <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-3xl border border-slate-100">
                         <div className="text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Overall Met</p>
                           <p className="text-2xl font-black text-indigo-600">{globalStats.overallSla}%</p>
                         </div>
                         <div className="p-3 bg-indigo-600 text-white rounded-2xl"><Sparkles size={20} /></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                      {[
                        { key: 'restaurant', label: 'Restaurant', icon: Store, color: 'rose', pct: globalStats.rPct },
                        { key: 'massage', label: 'Massage', icon: Stethoscope, color: 'emerald', pct: globalStats.mPct },
                        { key: 'ai', label: 'AI Receptionist', icon: Bot, color: 'blue', pct: globalStats.aPct }
                      ].map(item => (
                        <div key={item.key} className="bg-slate-50/80 p-8 rounded-[3rem] border border-slate-100 space-y-6">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 bg-${item.color}-100 text-${item.color}-600 rounded-2xl`}><item.icon size={20} /></div>
                            <h4 className="font-black text-slate-800">{item.label}</h4>
                          </div>
                          <p className="text-3xl font-black text-slate-900">{item.pct}%</p>
                          {isManager ? (
                            <div className="space-y-3 pt-4 border-t border-slate-200/50">
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Met Count</span>
                                <input type="number" value={(projectSLA as any)[item.key].met || ''} onChange={(e) => updateProjectSLA(item.key as any, 'met', e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black text-slate-800 outline-none focus:border-blue-500" placeholder="Met" />
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-[9px] font-black text-slate-400 uppercase">Total Count</span>
                                <input type="number" value={(projectSLA as any)[item.key].total || ''} onChange={(e) => updateProjectSLA(item.key as any, 'total', e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black text-slate-800 outline-none focus:border-blue-500" placeholder="Total" />
                              </div>
                            </div>
                          ) : (
                            <div className="pt-4 border-t border-slate-200/50 flex items-center justify-between text-[10px] font-black uppercase text-slate-400">
                               <span>Volume: {(projectSLA as any)[item.key].total}</span>
                               <span className="text-blue-500">Met: {(projectSLA as any)[item.key].met}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-purple-600 text-white rounded-[1.5rem] shadow-lg shadow-purple-500/20"><LineChart size={24} /></div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Customer Loyalty Metrics</h3>
                        <p className="text-slate-400 font-bold text-sm">Retention and Repeat service analysis</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                        <div className="flex justify-between items-center">
                          <h5 className="font-black text-slate-800 flex items-center gap-2"><UserMinus size={18} className="text-purple-600" /> Retention</h5>
                          <span className="text-2xl font-black text-purple-600">{globalStats.retentionPct}%</span>
                        </div>
                        {isManager ? (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                               <span className="text-[9px] font-black text-slate-400 uppercase">Start</span>
                               <input type="number" value={growthMetrics.retention.startCount || ''} onChange={(e) => updateGrowthMetric('retention', 'startCount', e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black text-slate-800 outline-none" />
                            </div>
                            <div className="space-y-1">
                               <span className="text-[9px] font-black text-slate-400 uppercase">End</span>
                               <input type="number" value={growthMetrics.retention.endCount || ''} onChange={(e) => updateGrowthMetric('retention', 'endCount', e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black text-slate-800 outline-none" />
                            </div>
                            <div className="space-y-1">
                               <span className="text-[9px] font-black text-slate-400 uppercase">New</span>
                               <input type="number" value={growthMetrics.retention.newCount || ''} onChange={(e) => updateGrowthMetric('retention', 'newCount', e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black text-slate-800 outline-none" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs font-black text-slate-400 italic">Data analysis active (Read Only)</div>
                        )}
                      </div>
                      <div className="space-y-6 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                        <div className="flex justify-between items-center">
                          <h5 className="font-black text-slate-800 flex items-center gap-2"><RefreshCcw size={18} className="text-orange-600" /> Return Rate</h5>
                          <span className="text-2xl font-black text-orange-600">{globalStats.returnRatePct}%</span>
                        </div>
                        {isManager ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <span className="text-[9px] font-black text-slate-400 uppercase">Returns</span>
                               <input type="number" value={growthMetrics.returnRate.returningCount || ''} onChange={(e) => updateGrowthMetric('returnRate', 'returningCount', e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black text-slate-800 outline-none" />
                            </div>
                            <div className="space-y-1">
                               <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
                               <input type="number" value={growthMetrics.returnRate.totalCount || ''} onChange={(e) => updateGrowthMetric('returnRate', 'totalCount', e.target.value)} className="w-full bg-white border border-slate-200 p-3 rounded-xl font-black text-slate-800 outline-none" />
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs font-black text-slate-400 italic">Data analysis active (Read Only)</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[4rem] p-12 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden h-fit">
                  <div className="absolute bottom-0 right-0 p-12 opacity-5 pointer-events-none -mb-10 -mr-10"><Activity size={200} /></div>
                  <div className="relative z-10 space-y-10">
                    <h3 className="text-2xl font-black flex items-center gap-3"><ShieldCheck className="text-blue-400" /> Daily KPIs</h3>
                    <div className="space-y-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-slate-400">CSAT Score ({globalStats.csatPct}%)</span><Smile size={18} className="text-emerald-400" /></div>
                        {isManager ? (
                          <div className="grid grid-cols-2 gap-4">
                            <input type="number" value={otherKPIs.csat.met || ''} onChange={(e) => updateOtherKPI('csat', 'met', e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-2xl font-black text-white text-center outline-none focus:bg-white/10" placeholder="Satisfied" />
                            <input type="number" value={otherKPIs.csat.total || ''} onChange={(e) => updateOtherKPI('csat', 'total', e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-2xl font-black text-white text-center outline-none focus:bg-white/10" placeholder="Total" />
                          </div>
                        ) : (
                          <div className="h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center px-6 text-xs font-black text-slate-500 italic">Secure KPI Vault</div>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-slate-400">Response Speed ({globalStats.speedPct}%)</span><Timer size={18} className="text-purple-400" /></div>
                        {isManager ? (
                          <div className="grid grid-cols-2 gap-4">
                            <input type="number" value={otherKPIs.responseSpeed.met || ''} onChange={(e) => updateOtherKPI('responseSpeed', 'met', e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-2xl font-black text-white text-center outline-none focus:bg-white/10" placeholder="On Time" />
                            <input type="number" value={otherKPIs.responseSpeed.total || ''} onChange={(e) => updateOtherKPI('responseSpeed', 'total', e.target.value)} className="bg-white/5 border border-white/10 p-4 rounded-2xl font-black text-white text-center outline-none focus:bg-white/10" placeholder="Total" />
                          </div>
                        ) : (
                          <div className="h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center px-6 text-xs font-black text-slate-500 italic">Secure KPI Vault</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'evaluate' && <EvaluationForm onAdd={(e) => { setEvaluations([...evaluations, e]); setActiveTab('dashboard'); }} />}
          {activeTab === 'qa' && <QAChecklist onSave={(r) => { setQaRecords([...qaRecords, r]); setActiveTab('dashboard'); }} />}
          {activeTab === 'assessment' && <AssessmentCenter assessments={assessments} onSave={(a) => setAssessments([a, ...assessments])} onTakeTest={handleTakeTest} onDelete={(id) => setAssessments(assessments.filter(a => a.id !== id))} />}
          {activeTab === 'grading' && <GradingDesk submissions={testSubmissions} assessments={assessments} onUpdate={updateSubmission} />}
          {activeTab === 'takeTest' && <TakeTest test={assessments.find(a => a.id === activeTestId)} submissions={testSubmissions} onSubmit={(s) => { updateSubmission(s); setActiveTab('dashboard'); window.location.hash = ''; }} />}
          {activeTab === 'proof' && <ProofVault proofs={proofRecords} onAdd={(p) => setProofRecords([p, ...proofRecords])} onDelete={(id) => setProofRecords(proofRecords.filter(p => p.id !== id))} />}
          {activeTab === 'peerReview' && <PeerReviewCollector onReceiveReview={(r) => setPeerReviewRecords([r, ...peerReviewRecords])} />}
          {activeTab === 'individual' && <IndividualDeepDive staffId={selectedStaffId} evaluations={evaluations} proofs={proofRecords} peerReviews={peerReviewRecords} onStaffChange={setSelectedStaffId} />}
          {activeTab === 'team' && <TeamAnalysis teamPerformance={teamPerformanceData} evaluations={evaluations} qaRecords={qaRecords} />}
          {activeTab === 'staffHub' && <StaffHub teamPerformance={teamPerformanceData} evaluations={evaluations} qaRecords={qaRecords} testSubmissions={testSubmissions} />}
          {activeTab === 'masterRecord' && <MasterRecord evaluations={evaluations} qaRecords={qaRecords} submissions={testSubmissions} />}
        </div>
      </main>
    </div>
  );
};

export default App;