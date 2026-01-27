
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';
import { 
  BarChart3, Clock, Users, Zap, TrendingUp, AlertCircle, ShieldCheck, 
  Info, Trash2, Upload, Settings, Plus, Loader2, CheckCircle2, FileText,
  CalendarDays, Filter, ChevronDown, History
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'settings'>('dashboard');
  
  // State for Month Selection
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // format: "YYYY-MM" or "all"

  // State for Task Intelligence Logic
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
  const [processedCount, setProcessedCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);

  // Sync to localstorage
  React.useEffect(() => {
    localStorage.setItem('cs_task_configs_v1', JSON.stringify(taskConfigs));
  }, [taskConfigs]);

  React.useEffect(() => {
    localStorage.setItem('cs_work_history_v1', JSON.stringify(workHistory));
  }, [workHistory]);

  // Extract unique months from workHistory for filtering
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    workHistory.forEach(item => {
      if (item.date && item.date !== "No Date") {
        const d = new Date(item.date);
        if (!isNaN(d.getTime())) {
          months.add(d.toISOString().substring(0, 7)); // "YYYY-MM"
        }
      }
    });
    return Array.from(months).sort().reverse();
  }, [workHistory]);

  const evaluateTaskWithAI = async (taskName: string, configs: TaskConfig[]) => {
    if (!taskName || configs.length === 0) return "Uncategorized";
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const categories = configs.map(c => `"${c.name}"`).join(", ");
      const systemPrompt = `คุณคือผู้ช่วยวิเคราะห์ประสิทธิภาพการทำงาน รับชื่อ Task และจัดกลุ่มเข้ากับหมวดหมู่: [${categories}] ตอบกลับด้วยชื่อหมวดหมู่ที่ตรงที่สุดเพียงอย่างเดียว หากไม่เกี่ยวข้องให้ตอบ "Uncategorized"`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Task Name: "${taskName}"`,
        config: { systemInstruction: systemPrompt }
      });
      
      return response.text.trim() || "Uncategorized";
    } catch (e) {
      console.error(e);
      return "Uncategorized";
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setProcessedCount(0);
    setTotalRows(0);
    setStatusMsg('กำลังอ่านไฟล์ Excel และเตรียมวิเคราะห์หมวดหมู่...');

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = (window as any).XLSX.read(data, { type: 'binary' });
        const rows = (window as any).XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        if (rows.length === 0) {
          setStatusMsg('ไม่พบข้อมูลในไฟล์ Excel');
          setIsProcessing(false);
          return;
        }

        setTotalRows(rows.length);
        const newHistory: WorkHistoryRecord[] = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          setProcessedCount(i + 1);
          
          const findField = (row: any, keys: string[]) => {
            const key = Object.keys(row).find(k => keys.some(s => k.toLowerCase().trim() === s.toLowerCase()));
            return key ? row[key] : null;
          };

          const taskName = findField(row, ['Name', 'Task Name', 'งาน']);
          const owner = findField(row, ['Task owner', 'Taskowner', 'Owner', 'เจ้าของงาน']);
          const dateVal = findField(row, ['Due date', 'Duedate', 'Date', 'วันที่']);

          let dateStr = "No Date";
          if (dateVal) {
             if (typeof dateVal === 'number') {
               const d = (window as any).XLSX.utils.format_cell({ v: dateVal, t: 'd' });
               dateStr = d || new Date().toISOString().split('T')[0];
             } else {
               dateStr = String(dateVal);
             }
          }

          if (taskName && owner) {
            const categoryName = await evaluateTaskWithAI(taskName, taskConfigs);
            const config = taskConfigs.find(c => c.name === categoryName);
            const minutes = config ? Number(config.minutes) : 0;

            newHistory.push({
              id: Math.random().toString(36).substr(2, 9),
              description: String(taskName),
              owner: String(owner).trim(),
              date: dateStr,
              category: categoryName,
              minutes: minutes,
              uploadedAt: new Date().toISOString()
            });
          }
        }
        
        // Incremental: Append new data to existing history
        setWorkHistory(prev => [...prev, ...newHistory]);
        setStatusMsg(`สำเร็จ! เพิ่มข้อมูลใหม่ ${newHistory.length} แถวเข้าระบบสะสมแล้ว`);
        setTimeout(() => { setStatusMsg(''); setIsProcessing(false); }, 3000);
      } catch (err) {
        console.error(err);
        setStatusMsg('เกิดข้อผิดพลาดในการประมวลผล');
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const dashboardStats = useMemo(() => {
    const dataMap: Record<string, { mins: number, tasks: number, byDate: Record<string, number>, maxDailyMins: number }> = {};
    
    // Filter workHistory based on selected month
    const filteredHistory = selectedMonth === 'all' 
      ? workHistory 
      : workHistory.filter(item => item.date.startsWith(selectedMonth));

    filteredHistory.forEach(item => {
      const owner = item.owner || 'Unknown';
      if (!dataMap[owner]) dataMap[owner] = { mins: 0, tasks: 0, byDate: {}, maxDailyMins: 0 };
      dataMap[owner].mins += (item.minutes || 0);
      dataMap[owner].tasks += 1;
      
      const d = item.date;
      if (!dataMap[owner].byDate[d]) dataMap[owner].byDate[d] = 0;
      dataMap[owner].byDate[d] += (item.minutes || 0);
      if (dataMap[owner].byDate[d] > dataMap[owner].maxDailyMins) {
        dataMap[owner].maxDailyMins = dataMap[owner].byDate[d];
      }
    });

    // Integrated Interaction Data for Chart (Filtered or All)
    const chartData = TEAM_MEMBERS.map(member => {
        // Here we filter evaluations as well if a month is selected
        const memberEvals = evaluations.filter(e => {
          const matchesStaff = e.staffId === member.id;
          const matchesMonth = selectedMonth === 'all' || e.date.startsWith(selectedMonth);
          return matchesStaff && matchesMonth;
        });
        
        const totalIncoming = memberEvals.reduce((a, b) => a + (b.incomingCalls || 0), 0);
        const totalOutgoing = memberEvals.reduce((a, b) => a + (b.outgoingCalls || 0), 0);
        const totalChats = memberEvals.reduce((a, b) => a + (b.totalChats || 0), 0);
        
        return {
          name: member.name,
          incoming: totalIncoming,
          outgoing: totalOutgoing,
          chats: totalChats
        };
    });

    // Table Stats sorted by Priority
    const tableData = Object.entries(dataMap).map(([name, data]) => ({
      name,
      ...data,
      hrs: data.mins / 60,
      peakHrs: data.maxDailyMins / 60
    })).sort((a, b) => {
      const idxA = PRIORITY_TEAM.indexOf(a.name);
      const idxB = PRIORITY_TEAM.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return { chartData, tableData, filteredCount: filteredHistory.length };
  }, [workHistory, evaluations, selectedMonth]);

  const globalSummary = useMemo(() => {
    const filteredHistory = selectedMonth === 'all' 
      ? workHistory 
      : workHistory.filter(item => item.date.startsWith(selectedMonth));
    const totalMins = filteredHistory.reduce((a, b) => a + b.minutes, 0);
    
    return {
      totalHrs: totalMins / 60,
      totalTasks: filteredHistory.length,
      activeMembers: dashboardStats.tableData.length
    };
  }, [workHistory, selectedMonth, dashboardStats]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Navigation & Month Filter Bar */}
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 p-3 rounded-[2.5rem] flex items-center justify-between shadow-xl sticky top-4 z-40 mx-2">
        <div className="flex items-center gap-5 pl-6">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
            <TrendingUp size={24} />
          </div>
          <div className="hidden md:block">
            <h2 className="font-black text-base uppercase tracking-tight text-slate-800 leading-none mb-1">Workload Intel</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] leading-none">Enterprise Analytics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors">
              <CalendarDays size={16} />
            </div>
            <select 
              className="pl-12 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              <option value="all">📅 ข้อมูลทั้งหมด (Cumulative)</option>
              {availableMonths.map(m => (
                <option key={m} value={m}>
                  {new Date(m).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2"></div>

          <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/50">
            {[
              { id: 'dashboard', icon: BarChart3, label: 'แดชบอร์ด' },
              { id: 'upload', icon: Upload, label: 'อัปโหลด' },
              { id: 'settings', icon: Settings, label: 'สอน AI' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-[11px] font-black transition-all uppercase tracking-wider ${
                  activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <tab.icon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-10">
          {/* Period Indicator */}
          <div className="flex items-center gap-3 px-8">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><History size={16}/></div>
             <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
               Viewing: <span className="text-indigo-600">{selectedMonth === 'all' ? 'ประวัติสะสมทั้งหมด' : `เดือน ${new Date(selectedMonth).toLocaleDateString('th-TH', {month: 'long', year: 'numeric'})}`}</span>
             </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <StatCard icon={Clock} color="bg-blue-50 text-blue-600" label="Total Workload" value={`${globalSummary.totalHrs.toFixed(1)} ชม.`} />
             <StatCard icon={Zap} color="bg-purple-50 text-purple-600" label="Tasks Logged" value={`${globalSummary.totalTasks} รายการ`} />
             <StatCard icon={Users} color="bg-indigo-50 text-indigo-600" label="Staff Involved" value={`${globalSummary.activeMembers} คน`} />
          </div>

          {/* Interaction Chart */}
          <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-10">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tight">
                 <BarChart3 className="text-blue-600" /> Interactions Breakdown
              </h3>
              <div className="flex items-center gap-6">
                 <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></div><span className="text-[10px] font-black text-slate-400 uppercase">Inbound</span></div>
                 <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#60a5fa]"></div><span className="text-[10px] font-black text-slate-400 uppercase">Outbound</span></div>
                 <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div><span className="text-[10px] font-black text-slate-400 uppercase">Chats</span></div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="incoming" name="Inbound" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={20} />
                  <Bar dataKey="outgoing" name="Outbound" fill="#60a5fa" radius={[8, 8, 0, 0]} barSize={20} />
                  <Bar dataKey="chats" name="Chats" fill="#10b981" radius={[8, 8, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Table */}
          <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-slate-200/40 border border-slate-200 overflow-hidden mx-2">
            <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">ประสิทธิภาพรายบุคคล ({selectedMonth === 'all' ? 'สะสม' : 'รายเดือน'})</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">คำนวณจาก Task ทั้งหมดที่อัปโหลดเข้าระบบ</p>
                </div>
              </div>
              {workHistory.length > 0 && isManager && (
                <button 
                  onClick={() => { if(window.confirm("คำเตือน: นี่จะล้างประวัติงานทั้งหมดทุกเดือน! คุณแน่ใจหรือไม่?")) setWorkHistory([]); }}
                  className="px-8 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center gap-2"
                >
                  <Trash2 size={14} /> Clear All History
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-8">พนักงาน (TASK OWNER)</th>
                    <th className="px-8 py-8 text-center">ชั่วโมงรวมสะสม</th>
                    <th className="px-8 py-8 text-center">PEAK DAILY (ชม.)</th>
                    <th className="px-10 py-8">การประเมินสถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardStats.tableData.map((data) => {
                    // Logic: Threshold adjusts based on time period
                    const isAllTime = selectedMonth === 'all';
                    const maxAllowed = isAllTime ? 1000 : 178; // Just example for All Time
                    const isWarning = data.hrs > maxAllowed || data.peakHrs > 8;
                    const progress = Math.min((data.hrs / maxAllowed) * 100, 100);

                    return (
                      <tr key={data.name} className={`group hover:bg-slate-50/80 transition-all ${isWarning ? 'bg-red-50/20' : ''}`}>
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-5">
                            <div className={`w-14 h-14 rounded-[1.25rem] flex items-center justify-center font-black text-xl shadow-sm ${PRIORITY_TEAM.includes(data.name) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                              {data.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-black text-slate-900 text-xl tracking-tight leading-none mb-1.5">{data.name}</div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                 <FileText size={10} className="text-indigo-400"/> {data.tasks} Tasks Logged
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`px-8 py-8 text-center font-black text-4xl tracking-tighter ${data.hrs > maxAllowed ? 'text-red-600' : 'text-indigo-600'}`}>
                          {data.hrs.toFixed(1)}
                        </td>
                        <td className={`px-8 py-8 text-center font-bold text-2xl tracking-tight ${data.peakHrs > 8 ? 'text-orange-600' : 'text-slate-500'}`}>
                          {data.peakHrs.toFixed(1)}
                        </td>
                        <td className="px-10 py-8 min-w-[280px]">
                          {isWarning ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-red-600 font-black text-sm italic animate-pulse">
                                <AlertCircle size={18} /> High Workload Detected
                              </div>
                              <div className="h-2.5 w-full bg-red-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-red-500 rounded-full" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                                <ShieldCheck size={18} /> Optimal Workload
                              </div>
                              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {dashboardStats.tableData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-10 py-40 text-center text-slate-300 italic flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                          <Info size={48} />
                        </div>
                        <p className="font-black uppercase tracking-[0.3em] text-xs">No data available for this period</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-500 py-10">
          <div className="bg-indigo-900 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden group mb-10">
             <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <History size={160} />
             </div>
             <h2 className="text-4xl font-black tracking-tight mb-4">Incremental Data Update</h2>
             <p className="text-indigo-200 font-bold leading-relaxed max-w-xl">
               ทุกครั้งที่คุณอัปโหลด ระบบจะนำข้อมูลไปวิเคราะห์และบันทึกสะสมรวมกับเดือนที่ผ่านมา ไม่มีการลบข้อมูลเดิมทิ้ง ทำให้คุณสามารถดูแนวโน้มภาระงานย้อนหลังได้ตลอดเวลาครับ
             </p>
          </div>

          <div className={`relative border-[8px] border-dashed rounded-[5rem] p-32 text-center transition-all ${isProcessing ? 'border-indigo-400 bg-indigo-50 cursor-wait shadow-inner' : 'border-slate-100 bg-white hover:border-indigo-500 hover:shadow-3xl hover:-translate-y-2 group'}`}>
            <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isProcessing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait" />
            <div className="flex flex-col items-center">
              <div className={`w-32 h-32 rounded-[3rem] flex items-center justify-center mb-12 shadow-2xl transition-all ${isProcessing ? 'bg-indigo-600 animate-bounce' : 'bg-slate-50 text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white'}`}>
                {isProcessing ? <Loader2 className="animate-spin text-white" size={48} /> : <Upload size={48} />}
              </div>
              <h2 className="text-4xl font-black tracking-tighter text-slate-900 mb-6 uppercase">Append New Worksheet</h2>
              <p className="text-slate-500 font-bold max-w-sm mx-auto leading-relaxed uppercase tracking-tight text-sm">ลากไฟล์ Excel ใหม่เข้ามาเพื่อเพิ่มข้อมูลเข้าระบบวิเคราะห์สะสม</p>
            </div>
          </div>

          {statusMsg && (
            <div className="bg-white p-12 rounded-[4rem] border border-indigo-100 shadow-3xl shadow-indigo-100/50 flex items-start gap-10 animate-in zoom-in-95">
              {isProcessing ? (
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="absolute w-full h-full transform -rotate-90">
                    <circle className="text-indigo-50" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="48" cy="48" />
                    <circle className="text-indigo-600 transition-all duration-300" strokeWidth="10" strokeDasharray={251.3} strokeDashoffset={251.3 - (251.3 * processedCount / (totalRows || 1))} strokeLinecap="round" stroke="currentColor" fill="transparent" r="40" cx="48" cy="48" />
                  </svg>
                  <span className="text-xl font-black text-indigo-600">{totalRows > 0 ? Math.round((processedCount/totalRows)*100) : 0}%</span>
                </div>
              ) : (
                <div className="w-24 h-24 shrink-0 rounded-[2rem] bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
              )}
              <div className="flex-1 pt-4">
                <h4 className="font-black text-3xl uppercase tracking-tighter text-slate-900">{isProcessing ? 'AI Processing Data...' : 'Incremental Update Successful!'}</h4>
                <p className="text-slate-500 font-bold mt-2 text-base">{statusMsg}</p>
                {isProcessing && totalRows > 0 && (
                  <div className="mt-8 flex justify-between items-center text-[12px] font-black uppercase tracking-[0.3em] text-indigo-500">
                    <span>Rows: {processedCount} / {totalRows}</span>
                    <span className="animate-pulse">Processing... Do not close window</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right-8 duration-500 py-10">
          <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-200">
            <h2 className="text-3xl font-black flex items-center gap-5 mb-12 text-slate-900 uppercase tracking-tight">
              <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl"><Plus size={28} /></div>
              Task Mapping Rules (AI Training)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">หมวดหมู่งาน (Target Category)</label>
                <input className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-xl transition-all" placeholder="เช่น ตอบเมลลูกค้า, ประชุมทีม" id="nt-name" />
              </div>
              <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">เวลามาตรฐาน (Minutes per task)</label>
                <div className="flex gap-4">
                  <input className="flex-1 px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-8 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none font-black text-xl transition-all" placeholder="เช่น 45" type="number" id="nt-mins" />
                  <button 
                    onClick={() => {
                      const n = document.getElementById('nt-name') as HTMLInputElement; 
                      const m = document.getElementById('nt-mins') as HTMLInputElement;
                      if(n.value && m.value) { 
                        setTaskConfigs([...taskConfigs, { id: Math.random().toString(36).substr(2, 9), name: n.value, minutes: Number(m.value) }]); 
                        n.value=''; m.value=''; 
                      }
                    }}
                    className="bg-indigo-600 text-white px-12 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-700 active:scale-95 transition-all shadow-2xl shadow-indigo-200"
                  >
                    Save Rule
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[4rem] shadow-2xl shadow-slate-200/40 border border-slate-200 overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
               <div className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400">Rules Engine Brain ({taskConfigs.length})</div>
            </div>
            <div className="divide-y divide-slate-100">
              {taskConfigs.map(c => (
                <div key={c.id} className="p-8 flex justify-between items-center hover:bg-slate-50 transition-all group">
                  <div className="flex items-center gap-8">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      <Zap size={28} />
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-2xl tracking-tight">{c.name}</div>
                      <div className="text-[11px] font-black text-indigo-500 px-5 py-2 bg-indigo-50 rounded-full inline-block mt-3 uppercase tracking-widest border border-indigo-100 shadow-sm">{c.minutes} นาที / Task</div>
                    </div>
                  </div>
                  <button onClick={() => setTaskConfigs(taskConfigs.filter(item => item.id !== c.id))} className="p-5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                    <Trash2 size={24} />
                  </button>
                </div>
              ))}
              {taskConfigs.length === 0 && (
                <div className="p-32 text-center text-slate-300 font-black italic tracking-tighter uppercase text-sm">ยังไม่มีกฎการวิเคราะห์ กรุณาเพิ่มหมวดหมู่งานด้านบน</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, color, label, value }: { icon: any, color: string, label: string, value: string }) => (
  <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all hover:-translate-y-2 group">
    <div className="flex items-center gap-8">
      <div className={`p-6 rounded-[2rem] ${color} shadow-lg transition-transform group-hover:scale-110`}>
        <Icon size={32} />
      </div>
      <div>
        <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-3">{label}</p>
        <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
      </div>
    </div>
  </div>
);

export default WorkloadAnalytics;
