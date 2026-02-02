
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  BarChart3, Clock, Users, Zap, TrendingUp, AlertCircle, ShieldCheck, 
  Info, Trash2, Upload, Settings, Plus, Loader2, CheckCircle2, FileText,
  CalendarDays, ChevronDown, History, BookOpen, ArrowRight, Save
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

  // State สำหรับงานที่ AI ไม่แน่ใจ
  const [pendingReviewTasks, setPendingReviewTasks] = useState<WorkHistoryRecord[]>([]);

  React.useEffect(() => {
    localStorage.setItem('cs_task_configs_v1', JSON.stringify(taskConfigs));
  }, [taskConfigs]);

  React.useEffect(() => {
    localStorage.setItem('cs_work_history_v1', JSON.stringify(workHistory));
  }, [workHistory]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    workHistory.forEach(item => {
      if (item.date && item.date !== "No Date") {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          months.add(d.toISOString().substring(0, 7));
        }
      }
    });
    return Array.from(months).sort().reverse();
  }, [workHistory]);

  const evaluateTaskWithAI = async (taskName: string, configs: TaskConfig[]) => {
    if (!taskName) return "Uncategorized";
    if (configs.length === 0) return "Uncategorized";
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const categories = configs.map(c => `"${c.name}"`).join(", ");
      const systemPrompt = `คุณคือผู้เชี่ยวชาญด้าน Operations วิเคราะห์งานพนักงานและจัดกลุ่มเข้าหมวดหมู่ที่มีอยู่: [${categories}] 
หากงานที่ให้มา "มีความหมายใกล้เคียง" กับหมวดหมู่ใด ให้ตอบชื่อหมวดหมู่นั้นเพียงคำเดียวเท่านั้น
หากไม่มั่นใจ หรือเป็นงานใหม่ที่ไม่เกี่ยวข้องเลย ให้ตอบว่า "Uncategorized" เท่านั้น ห้ามเดาสุ่ม`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `วิเคราะห์งานนี้: "${taskName}"`,
        config: { systemInstruction: systemPrompt }
      });
      
      const result = response.text.trim().replace(/[".]/g, '');
      return result || "Uncategorized";
    } catch (e) {
      console.error("AI Error:", e);
      return "Uncategorized";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalRows(0);
    setPendingReviewTasks([]);
    setStatusMsg('กำลังเริ่มประมวลผลไฟล์...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = (window as any).XLSX.read(data, { type: 'binary' });
        const rows = (window as any).XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        if (!rows || rows.length === 0) {
          setStatusMsg('ไม่พบข้อมูลในไฟล์ Excel');
          setIsProcessing(false);
          return;
        }

        setTotalRows(rows.length);
        const validRecords: WorkHistoryRecord[] = [];
        const reviewQueue: WorkHistoryRecord[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setProcessedCount(i + 1);
          
          const findField = (row: any, keys: string[]) => {
            const key = Object.keys(row).find(k => keys.some(s => k.toLowerCase().replace(/\s/g, '') === s.toLowerCase().replace(/\s/g, '')));
            return key ? row[key] : null;
          };

          const taskName = findField(row, ['Name', 'TaskName', 'งาน', 'Description']);
          const owner = findField(row, ['Taskowner', 'Owner', 'เจ้าของงาน', 'Assignee']);
          const dateVal = findField(row, ['DueDate', 'Date', 'วันที่']);

          if (!taskName || !owner) continue;

          setCurrentRowName(String(taskName));
          setStatusMsg(`กำลังวิเคราะห์แถวที่ ${i+1}/${rows.length}...`);

          const categoryName = await evaluateTaskWithAI(String(taskName), taskConfigs);
          const config = taskConfigs.find(c => c.name === categoryName);
          const minutes = config ? Number(config.minutes) : 0;

          let dateStr = "No Date";
          if (dateVal) {
            if (typeof dateVal === 'number') {
              const d = (window as any).XLSX.utils.format_cell({ v: dateVal, t: 'd' });
              dateStr = d || new Date().toISOString().split('T')[0];
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

          // Delay เพื่อความนิ่งของ UI และป้องกัน API Rate Limit
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        setWorkHistory(prev => [...prev, ...validRecords]);
        
        if (reviewQueue.length > 0) {
          setPendingReviewTasks(reviewQueue);
          setStatusMsg(`วิเคราะห์เสร็จสิ้น! พบงานที่ไม่รู้จัก ${reviewQueue.length} รายการ กรุณาสอน AI เพิ่มเติมครับ`);
          setTimeout(() => {
            setIsProcessing(false);
            setActiveTab('review');
          }, 1500);
        } else {
          setStatusMsg(`วิเคราะห์เสร็จสมบูรณ์ 100%!`);
          setTimeout(() => {
            setIsProcessing(false);
            setActiveTab('dashboard');
          }, 1500);
        }
      } catch (err) {
        console.error(err);
        setStatusMsg('เกิดข้อผิดพลาดในการประมวลผล');
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
    const filteredHistory = selectedMonth === 'all' ? workHistory : workHistory.filter(item => item.date.startsWith(selectedMonth));

    filteredHistory.forEach(item => {
      const owner = item.owner || 'Unknown';
      const matchedName = PRIORITY_TEAM.find(pt => pt.toLowerCase().replace(/\s/g, '') === owner.toLowerCase().replace(/\s/g, '')) || owner;
      
      if (!dataMap[matchedName]) dataMap[matchedName] = { mins: 0, tasks: 0, byDate: {}, maxDailyMins: 0 };
      dataMap[matchedName].mins += (item.minutes || 0);
      dataMap[matchedName].tasks += 1;
      
      const d = item.date;
      if (!dataMap[matchedName].byDate[d]) dataMap[matchedName].byDate[d] = 0;
      dataMap[matchedName].byDate[d] += (item.minutes || 0);
      if (dataMap[matchedName].byDate[d] > dataMap[matchedName].maxDailyMins) {
        dataMap[matchedName].maxDailyMins = dataMap[matchedName].byDate[d];
      }
    });

    const tableData = Object.entries(dataMap).map(([name, data]) => ({
      name,
      ...data,
      hrs: data.mins / 60,
      peakHrs: data.maxDailyMins / 60
    })).sort((a, b) => {
      const idxA = PRIORITY_TEAM.indexOf(a.name);
      const idxB = PRIORITY_TEAM.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      return a.name.localeCompare(b.name);
    });

    return { tableData, filteredCount: filteredHistory.length };
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
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Data Engine v2.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'dashboard' && (
            <div className="relative group">
              <select 
                className="pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">📅 ข้อมูลทั้งหมด</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{new Date(m).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'แดชบอร์ด' },
              { id: 'upload', icon: Upload, label: 'อัปโหลด' },
              { id: 'settings', icon: Settings, label: 'สอน AI' },
              ...(pendingReviewTasks.length > 0 ? [{ id: 'review', icon: AlertCircle, label: `ต้องสอนเพิ่ม (${pendingReviewTasks.length})` }] : [])
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <StatCard icon={Clock} color="bg-blue-50 text-blue-600" label="Total Workload" value={`${(dashboardStats.tableData.reduce((a,b)=>a+b.hrs,0)).toFixed(1)} ชม.`} />
             <StatCard icon={Zap} color="bg-purple-50 text-purple-600" label="Tasks Logged" value={`${dashboardStats.filteredCount} รายการ`} />
             <StatCard icon={Users} color="bg-indigo-50 text-indigo-600" label="Staff Involved" value={`${dashboardStats.tableData.length} คน`} />
          </div>

          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden mx-2">
            <div className="p-10 border-b border-slate-100">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">ประสิทธิภาพงานรายบุคคล</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">คำนวณจากชั่วโมงมาตรฐานที่คุณสอน AI ไว้</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-8">เจ้าของงาน</th>
                    <th className="px-8 py-8 text-center">ชั่วโมงงานรวม</th>
                    <th className="px-8 py-8 text-center">Peak (วันเดียว)</th>
                    <th className="px-10 py-8">สถานะภาระงาน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardStats.tableData.map((data) => {
                    const isWarning = data.hrs > 178;
                    const progress = Math.min((data.hrs / 180) * 100, 100);
                    return (
                      <tr key={data.name} className={`hover:bg-slate-50 transition-all ${isWarning ? 'bg-rose-50/30' : ''}`}>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg">{data.name.charAt(0)}</div>
                            <div>
                               <div className="font-black text-slate-900 text-lg leading-none mb-1">{data.name}</div>
                               <div className="text-[10px] font-bold text-slate-400 uppercase">{data.tasks} งานที่บันทึก</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-8 text-center font-black text-3xl text-indigo-600 tracking-tighter">{data.hrs.toFixed(1)}</td>
                        <td className="px-8 py-8 text-center font-bold text-slate-400">{data.peakHrs.toFixed(1)}</td>
                        <td className="px-10 py-8 min-w-[200px]">
                           <div className="flex items-center gap-3">
                              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${isWarning ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${progress}%`}} />
                              </div>
                              <span className={`text-[10px] font-black uppercase ${isWarning ? 'text-rose-500' : 'text-indigo-500'}`}>
                                {isWarning ? 'Overloaded' : 'Normal'}
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
             <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">Upload Your Worksheet</h2>
             <p className="text-indigo-200 font-bold max-w-xl mx-auto italic">
               อัปโหลดไฟล์ Excel เพื่อให้ AI วิเคราะห์ชั่วโมงงาน หากมีรายการที่ AI ไม่รู้จัก ระบบจะคัดกรองมาให้คุณสอนเพิ่มทันทีครับ
             </p>
          </div>

          <div className={`relative border-8 border-dashed rounded-[5rem] p-24 text-center transition-all ${isProcessing ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 bg-white hover:border-indigo-500 group'}`}>
             <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isProcessing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait" />
             <div className="flex flex-col items-center">
                <div className={`w-32 h-32 rounded-[3.5rem] flex items-center justify-center mb-8 shadow-2xl transition-all ${isProcessing ? 'bg-indigo-600 animate-pulse' : 'bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                   {isProcessing ? <Loader2 className="animate-spin" size={48} /> : <Upload size={48} />}
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">
                   {isProcessing ? 'AI กำลังวิเคราะห์ข้อมูล...' : 'วางไฟล์ Excel ที่นี่'}
                </h3>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">คลิกเพื่อเลือกไฟล์ (xls, xlsx)</p>
             </div>
          </div>

          {isProcessing && (
            <div className="bg-white p-12 rounded-[4rem] border-2 border-indigo-100 shadow-2xl flex items-center gap-12 animate-in zoom-in-95">
               <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle className="text-slate-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                    <circle className="text-indigo-600 transition-all duration-300" strokeWidth="10" strokeDasharray={314.15} strokeDashoffset={314.15 - (314.15 * progressPercent / 100)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="50" cx="64" cy="64" />
                  </svg>
                  <span className="text-3xl font-black text-indigo-600">{progressPercent}%</span>
               </div>
               <div className="space-y-2">
                  <h4 className="text-2xl font-black text-slate-900 uppercase">Processing...</h4>
                  <p className="text-slate-500 font-bold text-sm italic">กำลังประมวลผล: {currentRowName.substring(0, 30)}...</p>
                  <div className="flex gap-2 pt-4">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">{statusMsg}</span>
                  </div>
               </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="max-w-4xl mx-auto space-y-10 py-10 animate-in slide-in-from-bottom-8">
           <div className="bg-rose-600 rounded-[4rem] p-12 text-white shadow-2xl flex items-center justify-between gap-10">
              <div className="space-y-2">
                 <h2 className="text-4xl font-black tracking-tight uppercase">AI Uncertainty Review</h2>
                 <p className="text-rose-100 font-bold italic">พบงาน {pendingReviewTasks.length} รายการที่ AI ไม่แน่ใจ กรุณาสอนเพิ่มเพื่อความแม่นยำครับ</p>
              </div>
              <div className="p-6 bg-white/20 rounded-[2.5rem]"><AlertCircle size={48} /></div>
           </div>

           <div className="space-y-6">
              {pendingReviewTasks.map(task => (
                <div key={task.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8 group transition-all hover:border-indigo-400">
                   <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                         <div className="flex items-center gap-3">
                           <span className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-[10px] font-black">{task.owner.charAt(0)}</span>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{task.owner} • {task.date}</p>
                         </div>
                         <h4 className="text-xl font-black text-slate-900 leading-tight">{task.description}</h4>
                      </div>
                      <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><HelpCircle className="animate-pulse" size={24} /></div>
                   </div>

                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row items-center gap-6">
                      <div className="flex-1 w-full space-y-3">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">เลือกหมวดหมู่ที่เหมาะสม (สอน AI)</label>
                         <select 
                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 font-black text-slate-700 outline-none"
                            onChange={(e) => handleApplyReview(task.id, e.target.value)}
                            defaultValue=""
                         >
                            <option value="" disabled>-- โปรดเลือกหมวดหมู่ --</option>
                            {taskConfigs.map(c => <option key={c.id} value={c.name}>{c.name} ({c.minutes} นาที)</option>)}
                         </select>
                      </div>
                      <div className="text-slate-300 hidden md:block"><ArrowRight size={24} /></div>
                      <div className="md:w-1/3 w-full">
                         <button onClick={() => setActiveTab('settings')} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                           <Plus size={14} /> สร้างหมวดหมู่ใหม่
                         </button>
                      </div>
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
                        if (pendingReviewTasks.length > 0) setActiveTab('review');
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

const HelpCircle = ({ className, size }: { className?: string, size?: number }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export default WorkloadAnalytics;
