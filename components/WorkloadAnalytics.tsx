
import React, { useMemo, useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
  BarChart3, Clock, Users, Zap, TrendingUp, AlertCircle, ShieldCheck, 
  Info, Trash2, Upload, Settings, Plus, Loader2, CheckCircle2, FileText,
  CalendarDays, ChevronDown, History, BookOpen, ArrowRight, Save, Search,
  Terminal, UserCheck, Play, RefreshCw, LayoutDashboard, BrainCircuit, ListTodo,
  FileSearch, CheckCircle, PlusCircle
} from 'lucide-react';
import { EvaluationRecord, TaskConfig, WorkHistoryRecord } from '../types.ts';
import { TEAM_MEMBERS } from '../constants.tsx';

interface WorkloadAnalyticsProps {
  evaluations: EvaluationRecord[];
  isManager: boolean;
}

const WorkloadAnalytics: React.FC<WorkloadAnalyticsProps> = ({ evaluations, isManager }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'settings' | 'review'>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  const [taskConfigs, setTaskConfigs] = useState<TaskConfig[]>(() => {
    const saved = localStorage.getItem('cs_task_configs_v7');
    return saved ? JSON.parse(saved) : [
      { id: 'def1', name: 'ตอบแชทลูกค้า', minutes: 10 },
      { id: 'def2', name: 'Email', minutes: 15 },
      { id: 'def3', name: 'Setup System', minutes: 60 }
    ];
  });
  
  const [workHistory, setWorkHistory] = useState<WorkHistoryRecord[]>(() => {
    const saved = localStorage.getItem('cs_work_history_v7');
    return saved ? JSON.parse(saved) : [];
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [currentRowName, setCurrentRowName] = useState('');
  const [processedCount, setProcessedCount] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [pendingTasks, setPendingTasks] = useState<WorkHistoryRecord[]>([]);

  useEffect(() => {
    localStorage.setItem('cs_task_configs_v7', JSON.stringify(taskConfigs));
  }, [taskConfigs]);

  useEffect(() => {
    localStorage.setItem('cs_work_history_v7', JSON.stringify(workHistory));
  }, [workHistory]);

  const addLog = (msg: string) => {
    setDebugLogs(prev => [msg, ...prev].slice(0, 15));
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

  const findConfigForTask = (taskName: string): TaskConfig | null => {
    const normalizedTask = taskName.toLowerCase().trim();
    return taskConfigs.find(c => {
      const configName = c.name.toLowerCase().trim();
      return normalizedTask.includes(configName) || configName.includes(normalizedTask);
    }) || null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input เพื่อให้เลือกไฟล์เดิมซ้ำได้ในกรณีที่รอบแรกพลาด
    const inputElement = e.target;
    
    // ตรวจสอบ Library
    if (!(window as any).XLSX) {
      alert("❌ ระบบประมวลผล Excel ยังไม่พร้อม (Library Missing)\nกรุณารอสักครู่แล้วลองใหม่อีกครั้งครับ");
      inputElement.value = '';
      return;
    }

    // เริ่มต้นกระบวนการ
    setIsProcessing(true);
    setProcessedCount(0);
    setTotalRows(0);
    setDebugLogs([]);
    setPendingTasks([]);
    
    addLog(`📁 ตรวจพบไฟล์: ${file.name}`);
    addLog("⏳ กำลังเตรียมความพร้อมระบบ...");

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        addLog("📖 กำลังอ่านข้อมูลในไฟล์...");
        const data = evt.target?.result;
        const workbook = (window as any).XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const rows = (window as any).XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        if (!rows || rows.length === 0) {
          addLog("❌ ไม่พบข้อมูลในแผ่นงานแรก");
          setIsProcessing(false);
          inputElement.value = '';
          return;
        }

        setTotalRows(rows.length);
        addLog(`✅ พบข้อมูลทั้งหมด ${rows.length} แถว`);
        
        const validRecords: WorkHistoryRecord[] = [];
        const unrecRecords: WorkHistoryRecord[] = [];

        const findValue = (row: any, keywords: string[]) => {
          const keys = Object.keys(row);
          const match = keys.find(k => {
            const cleanKey = k.toLowerCase().replace(/\s/g, '').replace(/_/g, '').replace(/-/g, '');
            return keywords.some(kw => cleanKey.includes(kw));
          });
          return match ? row[match] : null;
        };

        const taskKeywords = ['topic', 'task', 'งาน', 'รายละเอียด', 'description', 'subject', 'หัวข้อ', 'รายการ', 'งานที่ทำ', 'activity'];
        const ownerKeywords = ['owner', 'assignee', 'พนักงาน', 'ชื่อ', 'staff', 'เจ้าของ', 'user', 'name', 'ผู้รับผิดชอบ', 'ผู้ทำ', 'agent'];
        const dateKeywords = ['date', 'วันที่', 'time', 'created', 'due', 'วันเวลา'];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i] as any;
          setProcessedCount(i + 1);

          const taskRaw = findValue(row, taskKeywords);
          const ownerRaw = findValue(row, ownerKeywords);
          const dateRaw = findValue(row, dateKeywords);

          if (!taskRaw || !ownerRaw) {
            if (i === 0) {
              addLog(`⚠️ ไม่พบคอลัมน์สำคัญ (ชื่อพนักงาน/งาน) ในแถวที่ ${i+1}`);
            }
            continue;
          }

          const taskStr = String(taskRaw).trim();
          const ownerStr = String(ownerRaw).trim();
          setCurrentRowName(`${ownerStr}: ${taskStr.substring(0, 20)}...`);

          const config = findConfigForTask(taskStr);
          
          let finalDate = new Date().toISOString().split('T')[0];
          if (dateRaw) {
            if (typeof dateRaw === 'number') {
              finalDate = (window as any).XLSX.utils.format_cell({ v: dateRaw, t: 'd' }) || finalDate;
            } else {
              const d = new Date(dateRaw);
              if (!isNaN(d.getTime())) finalDate = d.toISOString().split('T')[0];
            }
          }

          const record: WorkHistoryRecord = {
            id: Math.random().toString(36).substr(2, 9),
            description: taskStr,
            owner: ownerStr,
            date: finalDate,
            category: config ? config.name : "Uncategorized",
            minutes: config ? Number(config.minutes) : 0,
            uploadedAt: new Date().toISOString()
          };

          if (!config) {
            unrecRecords.push(record);
          } else {
            validRecords.push(record);
          }

          // ป้องกัน Browser ค้างด้วยการ Yield
          if (i % 100 === 0) await new Promise(r => setTimeout(r, 0));
        }
        
        setWorkHistory(prev => [...prev, ...validRecords]);
        inputElement.value = ''; // ล้างค่าหลังทำเสร็จ

        if (unrecRecords.length > 0) {
          setPendingTasks(unrecRecords);
          addLog(`🚧 พบงานใหม่ที่ต้องระบุเวลาเพิ่ม...`);
          setTimeout(() => { setIsProcessing(false); setActiveTab('review'); }, 1000);
        } else {
          addLog(`🏆 นำเข้าข้อมูลสำเร็จทั้งหมด!`);
          setTimeout(() => { setIsProcessing(false); setActiveTab('dashboard'); }, 1000);
        }
      } catch (err) {
        addLog("❌ Error: " + String(err));
        setIsProcessing(false);
        inputElement.value = '';
      }
    };

    reader.onerror = () => {
      addLog("❌ ไม่สามารถอ่านไฟล์ได้");
      setIsProcessing(false);
      inputElement.value = '';
    };

    // ใช้ readAsArrayBuffer แทนแบบเดิมเพื่อความเสถียร
    reader.readAsArrayBuffer(file);
  };

  const groupedPendingTasks = useMemo(() => {
    const groups: Record<string, WorkHistoryRecord[]> = {};
    pendingTasks.forEach(t => {
      if (!groups[t.description]) groups[t.description] = [];
      groups[t.description].push(t);
    });
    return Object.entries(groups).map(([desc, items]) => ({
      description: desc,
      count: items.length,
      exampleOwner: items[0].owner,
      items: items
    })).sort((a, b) => b.count - a.count);
  }, [pendingTasks]);

  const handleQuickAddAndApply = (description: string, minutes: number) => {
    if (minutes <= 0) {
       alert("กรุณาระบุจำนวนนาทีให้ถูกต้องครับ");
       return;
    }
    
    const newConfig: TaskConfig = {
      id: Math.random().toString(36).substr(2, 9),
      name: description,
      minutes: minutes
    };
    setTaskConfigs(prev => [...prev, newConfig]);

    const itemsToUpdate = pendingTasks.filter(t => t.description === description);
    const updatedRecords = itemsToUpdate.map(t => ({
      ...t,
      category: description,
      minutes: minutes
    }));

    setWorkHistory(prev => [...prev, ...updatedRecords]);
    setPendingTasks(prev => prev.filter(t => t.description !== description));
    addLog(`✨ บันทึกกฎ "${description.substring(0, 15)}..." แล้ว`);
  };

  const dashboardStats = useMemo(() => {
    const dataMap: Record<string, { mins: number, tasks: number }> = {};
    
    TEAM_MEMBERS.forEach(m => {
      dataMap[m.name] = { mins: 0, tasks: 0 };
    });

    const filtered = selectedMonth === 'all' 
      ? workHistory 
      : workHistory.filter(h => h.date.startsWith(selectedMonth));

    filtered.forEach(h => {
      const matchedStaff = TEAM_MEMBERS.find(m => {
        const n1 = m.name.toLowerCase().replace(/\s/g, '');
        const n2 = h.owner.toLowerCase().replace(/\s/g, '');
        return n1.includes(n2) || n2.includes(n1);
      });

      const targetName = matchedStaff ? matchedStaff.name : h.owner;
      
      if (!dataMap[targetName]) dataMap[targetName] = { mins: 0, tasks: 0 };
      dataMap[targetName].mins += (Number(h.minutes) || 0);
      dataMap[targetName].tasks += 1;
    });

    return Object.entries(dataMap).map(([name, data]) => ({
      name,
      tasks: data.tasks,
      hrs: data.mins / 60
    })).sort((a, b) => b.hrs - a.hrs);
  }, [workHistory, selectedMonth]);

  const handleClearHistory = () => {
    if (confirm("⚠️ ต้องการล้างประวัติงานทั้งหมดใช่หรือไม่?")) {
      setWorkHistory([]);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 px-2">
      <div className="bg-white/90 backdrop-blur-2xl border border-slate-200 p-3 rounded-[2.5rem] flex items-center justify-between shadow-xl sticky top-4 z-40 mx-2">
        <div className="flex items-center gap-5 pl-6">
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-2xl">
            <BarChart3 size={24} />
          </div>
          <div className="hidden md:block">
            <h2 className="font-black text-base uppercase tracking-tight text-slate-800 leading-none mb-1">Workload Analytics</h2>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em]">Efficiency Dashboard</p>
          </div>
        </div>

        <div className="flex gap-1.5 p-1.5 bg-slate-100 rounded-2xl">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'upload', icon: Upload, label: 'Upload' },
            { id: 'settings', icon: Settings, label: 'Rules' },
            ...(pendingTasks.length > 0 ? [{ id: 'review', icon: AlertCircle, label: `Review (${groupedPendingTasks.length})` }] : [])
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
        <div className="space-y-10 animate-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between px-8 gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><CalendarDays size={20}/></div>
              <select 
                className="bg-transparent font-black text-sm uppercase tracking-widest text-slate-800 outline-none cursor-pointer border-b-2 border-slate-200 pb-1"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                <option value="all">สะสมทั้งหมด (Cumulative)</option>
                {availableMonths.map(m => (
                  <option key={m} value={m}>{new Date(m).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> พบข้อมูล {workHistory.length} รายการ
              </div>
              <button onClick={handleClearHistory} className="text-[10px] font-black text-rose-500 uppercase flex items-center gap-2 hover:text-rose-700 transition-colors">
                <Trash2 size={14} /> ล้างข้อมูลประวัติ
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                <tr>
                  <th className="px-10 py-8">เจ้าของงาน (Task Owner)</th>
                  <th className="px-8 py-8 text-center">ชั่วโมงทำงานรวม</th>
                  <th className="px-8 py-8 text-center">จำนวนชิ้นงาน</th>
                  <th className="px-10 py-8">สถานะ (180 HRS Limit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dashboardStats.map((data) => {
                  const progress = Math.min((data.hrs / 180) * 100, 100);
                  const isLow = data.tasks === 0;
                  return (
                    <tr key={data.name} className={`hover:bg-slate-50 transition-all ${isLow ? 'opacity-40' : ''}`}>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${isLow ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white shadow-lg'}`}>
                            {data.name.charAt(0)}
                          </div>
                          <div className="font-black text-slate-900 text-lg leading-none">{data.name}</div>
                        </div>
                      </td>
                      <td className="px-8 py-8 text-center">
                         <span className={`font-black text-4xl tracking-tighter ${data.hrs === 0 && !isLow ? 'text-rose-400' : isLow ? 'text-slate-300' : 'text-indigo-600'}`}>
                           {data.hrs.toFixed(1)}
                         </span>
                         <span className="text-xs text-slate-400 font-bold ml-1">HRS</span>
                      </td>
                      <td className="px-8 py-8 text-center font-black text-slate-700 text-xl">
                        {data.tasks} งาน
                      </td>
                      <td className="px-10 py-8 min-w-[280px]">
                         <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-1000 ${progress > 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{width: `${progress}%`}} />
                            </div>
                            <span className="text-[11px] font-black text-slate-400 w-12">{Math.round(progress)}%</span>
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="max-w-4xl mx-auto space-y-10 py-10">
          <div className="bg-slate-900 rounded-[4rem] p-16 text-white shadow-2xl relative overflow-hidden text-center">
             <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12"><History size={180} /></div>
             <h2 className="text-4xl font-black tracking-tight mb-4 uppercase">Upload Workload File</h2>
             <p className="text-slate-400 font-bold max-w-xl mx-auto italic opacity-80 leading-relaxed">
               อัปโหลด Excel เพื่อคำนวณชั่วโมงงานอัตโนมัติ (ระบบรองรับภาษาไทย)<br/>
               <span className="text-indigo-400">หาส่งไฟล์แล้วข้อมูลไม่ขึ้น:</span> โปรดตรวจสอบหัวข้อคอลัมน์ว่ามีคำว่า "พนักงาน" และ "งาน" หรือไม่
             </p>
          </div>

          {!isProcessing ? (
            <div className="relative border-8 border-dashed rounded-[5rem] p-24 text-center border-slate-100 bg-white hover:border-indigo-500 group transition-all">
               <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
               <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-[3.5rem] flex items-center justify-center mb-8 shadow-2xl bg-slate-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                     <Upload size={48} />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tighter">คลิกเพื่อเลือกไฟล์ Excel</h3>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">รองรับ .xlsx และ .xls</p>
               </div>
            </div>
          ) : (
            <div className="bg-white p-12 rounded-[4rem] border-2 border-indigo-100 shadow-2xl space-y-8 animate-in zoom-in-95">
               <div className="flex items-center gap-12">
                  <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                      <svg className="absolute w-full h-full transform -rotate-90">
                        <circle className="text-slate-100" strokeWidth="12" stroke="currentColor" fill="transparent" r="60" cx="72" cy="72" />
                        <circle className="text-indigo-600 transition-all duration-300" strokeWidth="12" strokeDasharray={377} strokeDashoffset={377 - (377 * (processedCount / totalRows) || 0)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="60" cx="72" cy="72" />
                      </svg>
                      <span className="text-4xl font-black text-indigo-600">{totalRows > 0 ? Math.round((processedCount / totalRows) * 100) : 0}%</span>
                  </div>
                  <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                         <span className="bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-full animate-pulse tracking-widest uppercase">Analyzing Data...</span>
                      </div>
                      <p className="text-slate-800 font-black text-lg truncate max-w-lg">{currentRowName || 'Processing...'}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Terminal size={12}/> {statusMsg}</p>
                  </div>
               </div>
               <div className="bg-slate-900 p-8 rounded-3xl space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar shadow-inner">
                  {debugLogs.map((log, i) => (
                    <p key={i} className="text-[11px] font-mono text-indigo-300 border-l-2 border-indigo-600 pl-4 py-1">
                       <span className="text-indigo-600/50">[{i+1}]</span> {log}
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
                 <h2 className="text-4xl font-black uppercase tracking-tight">ต้องระบุเวลา (Uncategorized)</h2>
                 <p className="text-rose-100 font-bold text-lg italic opacity-90">พบหัวข้องานใหม่ {groupedPendingTasks.length} กลุ่ม โปรดระบุเวลาเพื่อให้ Dashboard แสดงผลชั่วโมงงานครับ</p>
              </div>
              <div className="p-8 bg-white/20 rounded-[2.5rem]"><AlertCircle size={48} className="animate-bounce" /></div>
           </div>

           <div className="space-y-6">
              {groupedPendingTasks.map(group => (
                <div key={group.description} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-indigo-400 transition-all duration-300">
                   <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1 rounded-lg uppercase">{group.count} ชิ้นงาน</span>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">พนักงาน: {group.exampleOwner}</p>
                      </div>
                      <h4 className="font-black text-slate-800 text-xl leading-snug">{group.description}</h4>
                   </div>
                   <div className="w-full md:w-80 flex gap-3">
                      <div className="relative flex-1">
                        <input 
                          type="number" 
                          placeholder="นาทีต่อชิ้น..." 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 px-4 font-black text-center outline-none focus:border-indigo-500 shadow-inner"
                          id={`mins-${group.description}`}
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const input = document.getElementById(`mins-${group.description}`) as HTMLInputElement;
                          handleQuickAddAndApply(group.description, Number(input.value));
                        }}
                        className="px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <PlusCircle size={16}/> บันทึกกฎ
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-12 py-10">
          <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12 pointer-events-none"><BookOpen size={100} /></div>
            <h2 className="text-3xl font-black flex items-center gap-5 mb-10 text-slate-900 uppercase">
              <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl"><Settings size={28} /></div>
              กฎเกณฑ์การคำนวณเวลา (Topic Rules)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">คำสำคัญ (Keyword ในหัวข้องาน)</label>
                <input className="w-full px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-black text-xl shadow-inner focus:border-indigo-500" placeholder="เช่น ตอบแชท, Email, Onboarding" id="nt-name" />
              </div>
              <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest ml-1">นาทีมาตรฐาน (ต่อชิ้น)</label>
                <div className="flex gap-4">
                  <input className="flex-1 px-8 py-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none font-black text-xl shadow-inner focus:border-indigo-500" placeholder="30" type="number" id="nt-mins" />
                  <button 
                    onClick={() => {
                      const n = document.getElementById('nt-name') as HTMLInputElement; 
                      const m = document.getElementById('nt-mins') as HTMLInputElement;
                      if(n.value && m.value) { 
                        setTaskConfigs([...taskConfigs, { id: Math.random().toString(36).substr(2, 9), name: n.value, minutes: Number(m.value) }]); 
                        n.value=''; m.value=''; 
                      }
                    }}
                    className="bg-indigo-600 text-white px-10 rounded-3xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all"
                  >
                    บันทึกกฎ
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-[4rem] border border-slate-200 overflow-hidden shadow-sm">
             <div className="p-10 bg-slate-50 border-b border-slate-100 font-black text-[11px] uppercase text-slate-400 tracking-widest flex justify-between items-center">
               <span>กฎที่คุณสอนไว้แล้ว ({taskConfigs.length} รายการ)</span>
               <ShieldCheck size={16} className="text-indigo-500" />
             </div>
             <div className="divide-y divide-slate-100">
                {taskConfigs.map(c => (
                  <div key={c.id} className="p-8 flex justify-between items-center hover:bg-slate-50 transition-all group">
                     <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><CheckCircle size={20} /></div>
                        <div>
                           <p className="font-black text-slate-900 text-xl tracking-tight">{c.name}</p>
                           <p className="text-[10px] font-black text-indigo-500 uppercase mt-1 tracking-widest">{c.minutes} นาที / งาน</p>
                        </div>
                     </div>
                     <button onClick={() => setTaskConfigs(taskConfigs.filter(item => item.id !== c.id))} className="p-4 text-slate-200 hover:text-rose-500 transition-colors"><Trash2 size={24} /></button>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkloadAnalytics;
