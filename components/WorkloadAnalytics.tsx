
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  BarChart3, Clock, Users, Zap, TrendingUp, AlertCircle, ShieldCheck, 
  Info, Trash2, Upload, Settings, Plus, Loader2, CheckCircle2, FileText,
  CalendarDays, ChevronDown, History, BookOpen, ArrowRight, Save, Search,
  Terminal
} from 'lucide-react';
import { EvaluationRecord, TaskConfig, WorkHistoryRecord } from '../types.ts';
import { TEAM_MEMBERS } from '../constants.tsx';
import { GoogleGenAI } from "@google/genai";

interface WorkloadAnalyticsProps {
  evaluations: EvaluationRecord[];
  isManager: boolean;
}

const PRIORITY_TEAM = [
  "Gam Anantida",
  "Namva Kaniknan",
  "Aom Boonchutinan",
  "Sai Jutatip",
  "Noey Nataya",
  "Pume Thanut",
  "Pookie Nantaporn",
  "Aim Julaluk"
];

const WorkloadAnalytics: React.FC<WorkloadAnalyticsProps> = ({ evaluations, isManager }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'settings' | 'review'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const [taskConfigs, setTaskConfigs] = useState<TaskConfig[]>(() => {
    const saved = localStorage.getItem('cs_task_configs_v2');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [workHistory, setWorkHistory] = useState<WorkHistoryRecord[]>(() => {
    const saved = localStorage.getItem('cs_work_history_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [currentRowName, setCurrentRowName] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const [pendingReviewTasks, setPendingReviewTasks] = useState<WorkHistoryRecord[]>([]);

  useEffect(() => {
    localStorage.setItem('cs_task_configs_v2', JSON.stringify(taskConfigs));
  }, [taskConfigs]);

  useEffect(() => {
    localStorage.setItem('cs_work_history_v2', JSON.stringify(workHistory));
  }, [workHistory]);

  const addLog = (msg: string) => {
    setDebugLogs(prev => [msg, ...prev].slice(0, 10));
    setStatusMsg(msg);
  };

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    workHistory.forEach(item => {
      if (item.date && item.date.length >= 7) {
        const monthPart = item.date.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(monthPart)) months.add(monthPart);
      }
    });
    return Array.from(months).sort().reverse();
  }, [workHistory]);

  const evaluateTaskWithAI = async (taskName: string, configs: TaskConfig[]) => {
    if (!taskName) return "Uncategorized";
    
    // 1. ลอง Match แบบ Local ก่อน (เพื่อความเร็วและแม่นยำตามที่สอน)
    const normalizedTask = taskName.toLowerCase().trim();
    const localMatch = configs.find(c => 
      normalizedTask.includes(c.name.toLowerCase().trim()) || 
      c.name.toLowerCase().trim().includes(normalizedTask)
    );
    
    if (localMatch) return localMatch.name;

    // 2. ถ้า Local ไม่เจอ ให้ AI ช่วยวิเคราะห์
    if (configs.length === 0) return "Uncategorized";
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const categories = configs.map(c => `"${c.name}"`).join(", ");
      const systemPrompt = `คุณคือผู้เชี่ยวชาญด้าน Operations วิเคราะห์งานพนักงานและจัดกลุ่มเข้าหมวดหมู่: [${categories}] 
หากงานที่ให้มา "มีความหมายใกล้เคียง" กับหมวดหมู่ที่ระบุ ให้ตอบชื่อหมวดหมู่นั้นเพียงคำเดียว (Case Sensitive ตามที่ให้มา)
หากไม่มั่นใจ หรือเป็นงานใหม่ที่ไม่เกี่ยวข้องเลย ให้ตอบว่า "Uncategorized" เท่านั้น`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `งานที่ต้องวิเคราะห์: "${taskName}"`,
        config: { systemInstruction: systemPrompt, temperature: 0.1 }
      });
      
      const result = response.text.trim().replace(/[".]/g, '');
      
      // ตรวจสอบว่า AI ตอบตรงกับที่มีใน Config หรือไม่
      const finalMatch = configs.find(c => c.name.trim() === result.trim());
      return finalMatch ? finalMatch.name : "Uncategorized";
    } catch (e) {
      console.error("AI Error:", e);
      return "Uncategorized";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!(window as any).XLSX) {
      alert("ระบบกำลังโหลดเครื่องมืออ่านไฟล์... กรุณารอสักครู่แล้วลองใหม่");
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalRows(0);
    setDebugLogs([]);
    addLog("🚀 เริ่มต้นการประมวลผลไฟล์...");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = (window as any).XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = (window as any).XLSX.utils.sheet_to_json(sheet);

        if (!rows || rows.length === 0) {
          addLog("❌ ไม่พบข้อมูลในไฟล์ Excel");
          setIsProcessing(false);
          return;
        }

        setTotalRows(rows.length);
        addLog(`✅ พบข้อมูล ${rows.length} รายการ กำลังวิเคราะห์ทีละขั้นตอน...`);

        const validRecords: WorkHistoryRecord[] = [];
        const reviewQueue: WorkHistoryRecord[] = [];

        const findField = (row: any, keys: string[]) => {
          const rowKeys = Object.keys(row);
          const foundKey = rowKeys.find(rk => 
            keys.some(k => rk.toLowerCase().replace(/\s/g, '').includes(k.toLowerCase().replace(/\s/g, '')))
          );
          return foundKey ? row[foundKey] : null;
        };

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] as any;
          setProcessedCount(i + 1);

          const taskName = findField(row, ['name', 'task', 'งาน', 'description', 'รายละเอียด']);
          const owner = findField(row, ['owner', 'assignee', 'เจ้าของ', 'พนักงาน', 'staff']);
          const dateVal = findField(row, ['date', 'due', 'วันที่']);

          if (!taskName || !owner) {
            addLog(`⚠️ แถวที่ ${i+1}: ข้อมูลไม่ครบถ้วน (ข้าม)`);
            continue;
          }

          const taskStr = String(taskName);
          const ownerStr = String(owner).trim();
          setCurrentRowName(taskStr);

          // AI / Local Analysis
          const categoryName = await evaluateTaskWithAI(taskStr, taskConfigs);
          const config = taskConfigs.find(c => c.name === categoryName);
          const minutes = config ? Number(config.minutes) : 0;

          let dateStr = "No Date";
          if (dateVal) {
            if (typeof dateVal === 'number') {
              dateStr = (window as any).XLSX.utils.format_cell({ v: dateVal, t: 'd' }) || new Date().toISOString().split('T')[0];
            } else {
              dateStr = String(dateVal);
            }
          }

          const record: WorkHistoryRecord = {
            id: Math.random().toString(36).substr(2, 9),
            description: taskStr,
            owner: ownerStr,
            date: dateStr,
            category: categoryName,
            minutes: minutes,
            uploadedAt: new Date().toISOString()
          };

          if (categoryName === "Uncategorized") {
            reviewQueue.push(record);
            addLog(`📝 พบงานใหม่: ${taskStr.substring(0,20)}... (ส่งเข้าคิวสอน)`);
          } else {
            validRecords.push(record);
            addLog(`✨ วิเคราะห์สำเร็จ: ${categoryName} (${minutes} นาที)`);
          }

          // หน่วงเวลาเล็กน้อยเพื่อให้ UI อัปเดตและป้องกัน Rate Limit
          await new Promise(resolve => setTimeout(resolve, 80));
        }
        
        setWorkHistory(prev => [...prev, ...validRecords]);
        
        if (reviewQueue.length > 0) {
          setPendingReviewTasks(reviewQueue);
          addLog(`🎉 วิเคราะห์เสร็จสิ้น! มีงาน ${reviewQueue.length} รายการที่ต้องสอนเพิ่ม`);
          setTimeout(() => { setIsProcessing(false); setActiveTab('review'); }, 1500);
        } else {
          addLog(`🎉 เสร็จสมบูรณ์! ทุกรายการถูกจัดกลุ่มเรียบร้อย`);
          setTimeout(() => { setIsProcessing(false); setActiveTab('dashboard'); }, 1500);
        }
      } catch (err) {
        addLog("❌ เกิดข้อผิดพลาดร้ายแรงขณะอ่านไฟล์");
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleApplyReview = (taskId: string, categoryName: string) => {
    const task = pendingReviewTasks.find(t => t.id === taskId);
    if (!task) return;
    const config = taskConfigs.find(c => c.name === categoryName);
    if (!config) return;

    const updatedTask = { ...task, category: categoryName, minutes: config.minutes };
    setWorkHistory(prev => [...prev, updatedTask]);
    setPendingReviewTasks(prev => prev.filter(t => t.id !== taskId));

    if (pendingReviewTasks.length === 1) {
      setActiveTab('dashboard');
    }
  };

  const dashboardStats = useMemo(() => {
    const dataMap: Record<string, { mins: number, tasks: number, byDate: Record<string, number>, maxDailyMins: number }> = {};
    
    // Initialize Priority Team
    PRIORITY_TEAM.forEach(name => {
      dataMap[name] = { mins: 0, tasks: 0, byDate: {}, maxDailyMins: 0 };
    });

    const filteredHistory = selectedMonth === 'all' ? workHistory : workHistory.filter(item => item.date.startsWith(selectedMonth));

    filteredHistory.forEach(item => {
      const ownerRaw = item.owner || 'Unknown';
      const matchedName = PRIORITY_TEAM.find(pt => 
        pt.toLowerCase().replace(/\s/g, '').includes(ownerRaw.toLowerCase().replace(/\s/g, '')) ||
        ownerRaw.toLowerCase().replace(/\s/g, '').includes(pt.toLowerCase().replace(/\s/g, ''))
      );
      
      const targetName = matchedName || ownerRaw;
      if (!dataMap[targetName]) dataMap[targetName] = { mins: 0, tasks: 0, byDate: {}, maxDailyMins: 0 };
      
      dataMap[targetName].mins += (item.minutes || 0);
      dataMap[targetName].tasks += 1;
      
      const d = item.date;
      if (!dataMap[targetName].byDate[d]) dataMap[targetName].byDate[d] = 0;
      dataMap[targetName].byDate[d] += (item.minutes || 0);
      if (dataMap[targetName].byDate[d] > dataMap[targetName].maxDailyMins) {
        dataMap[targetName].maxDailyMins = dataMap[targetName].byDate[d];
      }
    });

    return Object.entries(dataMap).map(([name, data]) => ({
      name,
      ...data,
      hrs: data.mins / 60,
      peakHrs: data.maxDailyMins / 60
    })).sort((a, b) => {
      const idxA = PRIORITY_TEAM.indexOf(a.name);
      const idxB = PRIORITY_TEAM.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return b.hrs - a.hrs;
    });
  }, [workHistory, selectedMonth]);

  const progressPercent = totalRows > 0 ? Math.round((processedCount / totalRows) * 100) : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Tab Navigation */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 p-3 rounded-[2.5rem] flex items-center justify-between shadow-xl sticky top-4 z-40 mx-2">
        <div className="flex items-center gap-5 pl-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <TrendingUp size={24} />
          </div>
          <div className="hidden md:block">
            <h2 className="font-black text-base uppercase tracking-tight text-slate-800 leading-none mb-1">Workload Analytics</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Efficiency Engine v2.5</p>
          </div>
        </div>

        <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'แดชบอร์ด' },
            { id: 'upload', icon: Upload, label: 'อัปโหลด' },
            { id: 'settings', icon: Settings, label: 'สอน AI' },
            ...(pendingReviewTasks.length > 0 ? [{ id: 'review', icon: AlertCircle, label: `ต้องสอน (${pendingReviewTasks.length})` }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black transition-all uppercase tracking-wider ${
                activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <tab.icon size={14} className={tab.id === 'review' ? 'animate-pulse text-rose-500' : ''} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-10">
          <div className="flex items-center justify-between px-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><CalendarDays size={20}/></div>
              <select 
                className="bg-transparent font-black text-sm uppercase tracking-widest text-slate-800 outline-none cursor-pointer border-b-2 border-slate-200 pb-1"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">แสดงผลทั้งหมด (Cumulative)</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{new Date(m).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</option>
                ))}
              </select>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Last Synced: {new Date().toLocaleTimeString()}
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden mx-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-8">เจ้าของงาน</th>
                    <th className="px-8 py-8 text-center">ชั่วโมงงานรวม</th>
                    <th className="px-8 py-8 text-center">ชั่วโมง PEAK/วัน</th>
                    <th className="px-10 py-8">สถานะภาระงาน (180 ชม. Limit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardStats.map((data) => {
                    const isWarning = data.hrs > 178;
                    const progress = Math.min((data.hrs / 180) * 100, 100);
                    return (
                      <tr key={data.name} className={`hover:bg-slate-50 transition-all ${isWarning ? 'bg-rose-50/20' : ''}`}>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-lg">{data.name.charAt(0)}</div>
                            <div>
                               <div className="font-black text-slate-900 text-lg leading-none mb-1">{data.name}</div>
                               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{data.tasks} งานที่บันทึก</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8 text-center font-black text-4xl text-indigo-600 tracking-tighter">
                          {data.hrs.toFixed(1)} <span className="text-xs text-slate-400 font-bold ml-1">HRS</span>
                        </td>
                        <td className="px-8 py-8 text-center font-bold text-slate-400">{data.peakHrs.toFixed(1)}</td>
                        <td className="px-10 py-8 min-w-[280px]">
                           <div className="flex items-center gap-3">
                              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className={`h-full transition-all duration-1000 ${isWarning ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${progress}%`}} />
                              </div>
                              <span className={`text-[11px] font-black uppercase min-w-[70px] ${isWarning ? 'text-rose-500 animate-pulse' : 'text-indigo-500'}`}>
                                {isWarning ? 'OVERLOAD' : `${Math.round(progress)}%`}
                              </span>
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="max-w-4xl mx-auto space-y-10 py-10">
          <div className="bg-indigo-900 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden text-center">
             <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12"><History size={180} /></div>
             <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">Smart Worksheet Analysis</h2>
             <p className="text-indigo-200 font-bold max-w-xl mx-auto italic">
               อัปโหลด Excel เพื่อคำนวณชั่วโมงงาน ระบบจะดึงข้อมูล Task และเวลาตามที่คุณสอนไว้ หากเจอรายการใหม่ ระบบจะแจ้งเตือนให้คุณระบุเวลาเพิ่มครับ
             </p>
          </div>

          <div className={`relative border-8 border-dashed rounded-[5rem] p-24 text-center transition-all ${isProcessing ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-500 group'}`}>
             <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isProcessing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait" />
             <div className="flex flex-col items-center">
                <div className={`w-32 h-32 rounded-[3.5rem] flex items-center justify-center mb-8 shadow-2xl transition-all ${isProcessing ? 'bg-indigo-600 animate-pulse text-white' : 'bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                   {isProcessing ? <Loader2 className="animate-spin" size={48} /> : <Upload size={48} />}
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                   {isProcessing ? 'AI กำลังวิเคราะห์ข้อมูล...' : 'คลิกเพื่อเลือกไฟล์ Excel'}
                </h3>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 italic">รองรับ .xlsx, .xls (ระบบจะตรวจหาคอลัมน์ให้อัตโนมัติ)</p>
             </div>
          </div>

          {isProcessing && (
            <div className="bg-white p-12 rounded-[4rem] border-2 border-indigo-100 shadow-2xl space-y-8 animate-in zoom-in-95">
               <div className="flex items-center gap-12">
                  <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle className="text-slate-100" strokeWidth="12" stroke="currentColor" fill="transparent" r="60" cx="72" cy="72" />
                        <circle className="text-indigo-600 transition-all duration-300" strokeWidth="12" strokeDasharray={377} strokeDashoffset={377 - (377 * progressPercent / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="60" cx="72" cy="72" />
                      </svg>
                      <span className="text-4xl font-black text-indigo-600">{progressPercent}%</span>
                  </div>
                  <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse">LIVE ANALYSIS</span>
                        <h4 className="text-2xl font-black text-slate-900 uppercase">Engine is Analyzing</h4>
                      </div>
                      <p className="text-indigo-500 font-bold text-base italic truncate max-w-lg">กำลังประมวลผล: {currentRowName || 'เตรียมข้อมูล...'}</p>
                      <div className="flex items-center gap-2 text-slate-400">
                        <Terminal size={14} />
                        <p className="text-[10px] font-black uppercase tracking-widest">{statusMsg}</p>
                      </div>
                  </div>
               </div>
               
               <div className="bg-slate-900 p-8 rounded-3xl space-y-3 border border-slate-800 shadow-inner max-h-[200px] overflow-y-auto custom-scrollbar">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Deep Learning Console Log</p>
                  {debugLogs.map((log, i) => (
                    <p key={i} className="text-[11px] font-mono text-indigo-300 flex items-center gap-3">
                      <span className="text-indigo-600">[{new Date().toLocaleTimeString()}]</span> {log}
                    </p>
                  ))}
               </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="max-w-4xl mx-auto space-y-8 py-10 animate-in slide-in-from-bottom-8">
           <div className="bg-rose-600 rounded-[3rem] p-12 text-white shadow-2xl flex items-center justify-between gap-10">
              <div className="space-y-3">
                 <h2 className="text-4xl font-black uppercase tracking-tight">AI Training Required</h2>
                 <p className="text-rose-100 font-bold text-lg italic opacity-90">พบงานใหม่ {pendingReviewTasks.length} รายการที่ AI ไม่แน่ใจ กรุณาสอนเพิ่มเพื่อความแม่นยำครับ</p>
              </div>
              <div className="p-8 bg-white/20 rounded-[2.5rem]"><AlertCircle size={48} className="animate-bounce" /></div>
           </div>

           <div className="space-y-5">
              {pendingReviewTasks.map(task => (
                <div key={task.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-indigo-400 transition-all">
                   <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-lg uppercase">{task.owner}</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{task.date}</p>
                      </div>
                      <h4 className="font-black text-slate-800 text-xl leading-snug">{task.description}</h4>
                   </div>
                   <div className="w-full md:w-80 space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เลือกหมวดหมู่ที่เหมาะสม (สอน AI)</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-6 font-black text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                        onChange={(e) => handleApplyReview(task.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>-- เลือกหมวดหมู่งาน --</option>
                        {taskConfigs.map(c => <option key={c.id} value={c.name}>{c.name} ({c.minutes} นาที)</option>)}
                      </select>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-12 py-10 animate-in fade-in">
          <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5 text-indigo-600 rotate-12"><BookOpen size={120} /></div>
            <h2 className="text-3xl font-black flex items-center gap-5 mb-12 text-slate-900 uppercase">
              <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl"><Plus size={28} /></div>
              Knowledge Base Training
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อหมวดหมู่งาน (Keyword)</label>
                <input className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-black text-xl focus:border-indigo-500 transition-all shadow-inner" placeholder="เช่น ตอบ Email ลูกค้า" id="nt-name" />
              </div>
              <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">เวลามาตรฐาน (นาที/ชิ้น)</label>
                <div className="flex gap-4">
                  <input className="flex-1 px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-black text-xl focus:border-indigo-500 transition-all shadow-inner" placeholder="30" type="number" id="nt-mins" />
                  <button 
                    onClick={() => {
                      const n = document.getElementById('nt-name') as HTMLInputElement; 
                      const m = document.getElementById('nt-mins') as HTMLInputElement;
                      if(n.value && m.value) { 
                        setTaskConfigs([...taskConfigs, { id: Math.random().toString(36).substr(2, 9), name: n.value, minutes: Number(m.value) }]); 
                        n.value=''; m.value=''; 
                      }
                    }}
                    className="bg-indigo-600 text-white px-10 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 active:scale-95 transition-all"
                  >
                    สอนงานนี้
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[4rem] border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-10 border-b border-slate-100 font-black text-[11px] uppercase text-slate-400 tracking-widest flex justify-between items-center">
               <span>หมวดหมู่ที่คุณสอนไว้ ({taskConfigs.length})</span>
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Zap size={14} /></div>
             </div>
             <div className="divide-y divide-slate-100">
                {taskConfigs.length === 0 ? (
                  <div className="p-20 text-center text-slate-300 font-black uppercase tracking-widest">ยังไม่มีข้อมูลการสอน AI</div>
                ) : (
                  taskConfigs.map(c => (
                    <div key={c.id} className="p-8 flex justify-between items-center hover:bg-slate-50 transition-all group">
                       <div className="flex items-center gap-6">
                          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><CheckCircle2 size={20} /></div>
                          <div>
                             <p className="font-black text-slate-900 text-xl tracking-tight">{c.name}</p>
                             <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest">{c.minutes} นาที ต่อ 1 รายการ</p>
                          </div>
                       </div>
                       <button onClick={() => setTaskConfigs(taskConfigs.filter(item => item.id !== c.id))} className="p-4 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={24} /></button>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkloadAnalytics;
