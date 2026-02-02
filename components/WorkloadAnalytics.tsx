
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  BarChart3, Clock, Users, Zap, TrendingUp, AlertCircle, ShieldCheck, 
  Info, Trash2, Upload, Settings, Plus, Loader2, CheckCircle2, FileText,
  CalendarDays, ChevronDown, History, BookOpen, ArrowRight, Save, Search
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
    const saved = localStorage.getItem('cs_task_configs_v1');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [workHistory, setWorkHistory] = useState<WorkHistoryRecord[]>(() => {
    const saved = localStorage.getItem('cs_work_history_v1');
    return saved ? JSON.parse(saved) : [];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [currentRowName, setCurrentRowName] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  // State สำหรับงานที่ AI ไม่แน่ใจ
  const [pendingReviewTasks, setPendingReviewTasks] = useState<WorkHistoryRecord[]>([]);

  useEffect(() => {
    localStorage.setItem('cs_task_configs_v1', JSON.stringify(taskConfigs));
  }, [taskConfigs]);

  useEffect(() => {
    localStorage.setItem('cs_work_history_v1', JSON.stringify(workHistory));
  }, [workHistory]);

  // Fix: Added availableMonths to resolve the "Cannot find name 'availableMonths'" error
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    workHistory.forEach(item => {
      if (item.date && item.date.length >= 7) {
        // Try to extract YYYY-MM prefix
        const monthPart = item.date.substring(0, 7);
        if (/^\d{4}-\d{2}$/.test(monthPart)) {
          months.add(monthPart);
        }
      }
    });
    return Array.from(months).sort().reverse();
  }, [workHistory]);

  const addLog = (msg: string) => {
    setDebugLogs(prev => [msg, ...prev].slice(0, 5));
    setStatusMsg(msg);
  };

  const evaluateTaskWithAI = async (taskName: string, configs: TaskConfig[]) => {
    if (!taskName || configs.length === 0) return "Uncategorized";
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const categories = configs.map(c => `"${c.name}"`).join(", ");
      const systemPrompt = `คุณคือผู้เชี่ยวชาญด้าน Operations วิเคราะห์งานพนักงานและจัดกลุ่มเข้าหมวดหมู่: [${categories}] 
ตอบชื่อหมวดหมู่ที่ตรงที่สุด "คำเดียว" เท่านั้น หากไม่มั่นใจให้ตอบ "Uncategorized"`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `งาน: "${taskName}"`,
        config: { systemInstruction: systemPrompt }
      });
      
      return response.text.trim().replace(/[".]/g, '') || "Uncategorized";
    } catch (e) {
      return "Uncategorized";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!(window as any).XLSX) {
      alert("ระบบกำลังโหลด Library พิเศษ... กรุณารอสักครู่แล้วลองใหม่ครับ");
      return;
    }

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalRows(0);
    setDebugLogs([]);
    addLog("กำลังเปิดไฟล์...");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = (window as any).XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const rows = (window as any).XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!rows || rows.length === 0) {
          addLog("❌ ไม่พบข้อมูลในแผ่นงานแรก");
          setIsProcessing(false);
          return;
        }

        setTotalRows(rows.length);
        addLog(`✅ พบข้อมูลทั้งหมด ${rows.length} แถว เริ่มวิเคราะห์...`);

        const validRecords: WorkHistoryRecord[] = [];
        const reviewQueue: WorkHistoryRecord[] = [];

        // Helper to find column regardless of exact spelling
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
          const owner = findField(row, ['owner', 'assignee', 'เจ้าของ', 'พนักงาน']);
          const dateVal = findField(row, ['date', 'due', 'วันที่']);

          if (!taskName || !owner) {
            addLog(`⚠️ แถวที่ ${i+1} ข้อมูลไม่ครบ (ข้าม)`);
            continue;
          }

          setCurrentRowName(String(taskName));
          
          // AI Classification
          const categoryName = await evaluateTaskWithAI(String(taskName), taskConfigs);
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
            description: String(taskName),
            owner: String(owner).trim(),
            date: dateStr,
            category: categoryName,
            minutes: minutes,
            uploadedAt: new Date().toISOString()
          };

          if (categoryName === "Uncategorized") {
            reviewQueue.push(record);
          } else {
            validRecords.push(record);
          }

          // Small delay for UI update
          if (i % 5 === 0) await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        setWorkHistory(prev => [...prev, ...validRecords]);
        
        if (reviewQueue.length > 0) {
          setPendingReviewTasks(reviewQueue);
          addLog(`เสร็จสิ้น! พบงานที่ไม่รู้จัก ${reviewQueue.length} รายการ`);
          setTimeout(() => { setIsProcessing(false); setActiveTab('review'); }, 1000);
        } else {
          addLog(`เสร็จสมบูรณ์! เพิ่มข้อมูล ${validRecords.length} รายการ`);
          setTimeout(() => { setIsProcessing(false); setActiveTab('dashboard'); }, 1000);
        }
      } catch (err) {
        console.error(err);
        addLog("❌ เกิดข้อผิดพลาดในการอ่านไฟล์");
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleApplyReview = (taskId: string, categoryName: string) => {
    const task = pendingReviewTasks.find(t => t.id === taskId);
    if (!task) return;
    const config = taskConfigs.find(c => c.name === categoryName);
    const updatedTask = { ...task, category: categoryName, minutes: config?.minutes || 0 };
    setWorkHistory(prev => [...prev, updatedTask]);
    setPendingReviewTasks(prev => prev.filter(t => t.id !== taskId));
    if (pendingReviewTasks.length === 1) setActiveTab('dashboard');
  };

  const dashboardStats = useMemo(() => {
    const dataMap: Record<string, { mins: number, tasks: number, byDate: Record<string, number>, maxDailyMins: number }> = {};
    
    // Initialize all priority team members to 0
    PRIORITY_TEAM.forEach(name => {
      dataMap[name] = { mins: 0, tasks: 0, byDate: {}, maxDailyMins: 0 };
    });

    const filteredHistory = selectedMonth === 'all' ? workHistory : workHistory.filter(item => item.date.startsWith(selectedMonth));

    filteredHistory.forEach(item => {
      const ownerRaw = item.owner || 'Unknown';
      // Fuzzy matching to find in priority team
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
      {/* Header Tabs */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 p-3 rounded-[2.5rem] flex items-center justify-between shadow-xl sticky top-4 z-40 mx-2">
        <div className="flex items-center gap-5 pl-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <TrendingUp size={24} />
          </div>
          <div className="hidden md:block">
            <h2 className="font-black text-base uppercase tracking-tight text-slate-800 leading-none mb-1">Workload Intel</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Engine v2.1-STABLE</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'แดชบอร์ด' },
              { id: 'upload', icon: Upload, label: 'อัปโหลด' },
              { id: 'settings', icon: Settings, label: 'สอน AI' },
              ...(pendingReviewTasks.length > 0 ? [{ id: 'review', icon: AlertCircle, label: `Review (${pendingReviewTasks.length})` }] : [])
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
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-10">
          <div className="flex items-center justify-between px-8">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><CalendarDays size={16}/></div>
               <select 
                className="bg-transparent font-black text-xs uppercase tracking-widest text-slate-400 outline-none cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">แสดงทุกช่วงเวลา</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{new Date(m).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</option>
                ))}
              </select>
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
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">{data.name.charAt(0)}</div>
                            <div>
                               <div className="font-black text-slate-900 text-lg leading-none mb-1">{data.name}</div>
                               <div className="text-[10px] font-bold text-slate-400 uppercase">{data.tasks} Tasks</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8 text-center font-black text-3xl text-indigo-600 tracking-tighter">{data.hrs.toFixed(1)}</td>
                        <td className="px-8 py-8 text-center font-bold text-slate-400">{data.peakHrs.toFixed(1)}</td>
                        <td className="px-10 py-8 min-w-[250px]">
                           <div className="flex items-center gap-3">
                              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full transition-all duration-1000 ${isWarning ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${progress}%`}} />
                              </div>
                              <span className={`text-[10px] font-black uppercase min-w-[60px] ${isWarning ? 'text-rose-500' : 'text-indigo-500'}`}>
                                {isWarning ? 'Critical' : `${Math.round(progress)}%`}
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
             <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">Smart Workload Uploader</h2>
             <p className="text-indigo-200 font-bold max-w-xl mx-auto italic">
               ระบบจะตรวจหาคอลัมน์ [เจ้าของงาน] และ [ชื่องาน] โดยอัตโนมัติ หาก AI ไม่แน่ใจจะแยกงานไว้ให้คุณสอนเพิ่มทันที
             </p>
          </div>

          <div className={`relative border-8 border-dashed rounded-[5rem] p-24 text-center transition-all ${isProcessing ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-500 group'}`}>
             <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isProcessing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait" />
             <div className="flex flex-col items-center">
                <div className={`w-32 h-32 rounded-[3.5rem] flex items-center justify-center mb-8 shadow-2xl transition-all ${isProcessing ? 'bg-indigo-600 animate-pulse' : 'bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                   {isProcessing ? <Loader2 className="animate-spin" size={48} /> : <Upload size={48} />}
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                   {isProcessing ? 'กำลังประมวลผล...' : 'คลิกเพื่อเลือกไฟล์ Excel'}
                </h3>
             </div>
          </div>

          {isProcessing && (
            <div className="bg-white p-12 rounded-[4rem] border-2 border-indigo-100 shadow-2xl space-y-8 animate-in zoom-in-95">
               <div className="flex items-center gap-12">
                  <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle className="text-slate-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                        <circle className="text-indigo-600 transition-all duration-300" strokeWidth="10" strokeDasharray={314.15} strokeDashoffset={314.15 - (314.15 * progressPercent / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                      </svg>
                      <span className="text-3xl font-black text-indigo-600">{progressPercent}%</span>
                  </div>
                  <div className="space-y-3 flex-1">
                      <h4 className="text-2xl font-black text-slate-900 uppercase">Analysis Engine Active</h4>
                      <p className="text-indigo-500 font-bold text-sm italic">{currentRowName || 'เตรียมข้อมูล...'}</p>
                      <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{statusMsg}</p>
                  </div>
               </div>
               
               <div className="bg-slate-50 p-6 rounded-3xl space-y-2 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Log</p>
                  {debugLogs.map((log, i) => (
                    <p key={i} className="text-[11px] font-bold text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> {log}
                    </p>
                  ))}
               </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="max-w-4xl mx-auto space-y-8 py-10">
           <div className="bg-rose-600 rounded-[3rem] p-10 text-white shadow-xl flex items-center justify-between">
              <div>
                 <h2 className="text-3xl font-black uppercase">Teaching Required</h2>
                 <p className="font-bold opacity-80">พบงานใหม่ {pendingReviewTasks.length} รายการที่ AI ยังไม่รู้จัก</p>
              </div>
              <AlertCircle size={48} className="opacity-30" />
           </div>
           <div className="space-y-4">
              {pendingReviewTasks.map(task => (
                <div key={task.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between gap-6 group hover:border-indigo-400 transition-all">
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{task.owner} • {task.date}</p>
                      <h4 className="font-black text-slate-800 text-lg leading-tight">{task.description}</h4>
                   </div>
                   <div className="w-64">
                      <select 
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-black text-xs text-slate-700 outline-none"
                        onChange={(e) => handleApplyReview(task.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>เลือกหมวดหมู่...</option>
                        {taskConfigs.map(c => <option key={c.id} value={c.name}>{c.name} ({c.minutes} นาที)</option>)}
                      </select>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-12 py-10">
          <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-200">
            <h2 className="text-3xl font-black flex items-center gap-5 mb-12 text-slate-900 uppercase">
              <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl"><Plus size={28} /></div>
              AI Knowledge Training
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">ชื่อหมวดหมู่งาน</label>
                <input className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-black text-xl focus:border-indigo-500 transition-all" placeholder="เช่น ตอบ Email ลูกค้า" id="nt-name" />
              </div>
              <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">เวลามาตรฐาน (นาที/Task)</label>
                <div className="flex gap-4">
                  <input className="flex-1 px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-black text-xl focus:border-indigo-500 transition-all" placeholder="เช่น 30" type="number" id="nt-mins" />
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
                    บันทึกกฎ
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[4rem] border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-10 border-b border-slate-100 font-black text-[11px] uppercase text-slate-400 tracking-widest">หมวดหมู่ที่คุณสอนไว้ ({taskConfigs.length})</div>
             <div className="divide-y divide-slate-100">
                {taskConfigs.map(c => (
                  <div key={c.id} className="p-8 flex justify-between items-center hover:bg-slate-50 transition-all">
                     <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Zap size={20} /></div>
                        <div>
                           <p className="font-black text-slate-900 text-xl tracking-tight">{c.name}</p>
                           <p className="text-[10px] font-black text-indigo-500 uppercase">{c.minutes} นาที ต่อรายการ</p>
                        </div>
                     </div>
                     <button onClick={() => setTaskConfigs(taskConfigs.filter(item => item.id !== c.id))} className="p-4 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={24} /></button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, color, label, value }: { icon: any, color: string, label: string, value: string }) => (
  <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 group">
    <div className="flex items-center gap-8">
      <div className={`p-6 rounded-[2rem] ${color} transition-transform group-hover:scale-110`}>
        <Icon size={32} />
      </div>
      <div>
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
      </div>
    </div>
  </div>
);

export default WorkloadAnalytics;
