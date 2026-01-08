import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  Save, 
  HelpCircle,
  FileText,
  User,
  Calendar,
  ChevronRight,
  TrendingUp,
  Layout,
  MessageSquare,
  FileCheck,
  Mail,
  Send
} from 'lucide-react';
import { TEAM_MEMBERS } from '../constants.tsx';
import { QARecord, QASection } from '../types.ts';

interface QAChecklistProps {
  onSave: (record: QARecord) => void;
}

const INITIAL_SECTIONS: Omit<QASection, 'overallScore'>[] = [
  {
    title: "1. Handling Live Projects (Project LIVE & Average Project Completion Time)",
    items: [
      { label: "Ensures smooth execution of Project Building", score: 0 },
      { label: "Follows all steps correctly when setting up a new system", score: 0 },
      { label: "Identifies and resolves potential issues before going live", score: 0 },
      { label: "Updates project status on CRM to keep track of progress", score: 0 },
      { label: "Ensures customers understand how to use their systems effectively ( Satisfaction call )", score: 0 },
    ],
    caseRef: "",
    comment: ""
  },
  {
    title: "2. Response & Resolution Time",
    items: [
      { label: "(First Response Time & Resolution Time) Respond.io / email", score: 0 },
      { label: "Resolves issues efficiently while maintaining accuracy", score: 0 },
      { label: "Uses professional, friendly, and service-oriented communication", score: 0 },
      { label: "Asks for clarification when needed to avoid miscommunication and Follows up to ensure the issue is fully resolved and the customer is satisfied", score: 0 },
      { label: "Ensures customers feel heard and valued (ลูกค้าต้องการให้ช่วยเหลือเพิ่มเติมไหมคะ)", score: 0 },
    ],
    caseRef: "",
    comment: ""
  },
  {
    title: "3. Documentation & Accuracy",
    items: [
      { label: "Task all interactions and updates accurately in the system", score: 0 },
      { label: "Avoids misinformation by cross-checking details before providing answers", score: 0 },
      { label: "Adheres to company policies when handling sensitive information", score: 0 },
    ],
    caseRef: "",
    comment: ""
  }
];

const QAChecklist: React.FC<QAChecklistProps> = ({ onSave }) => {
  const [staffId, setStaffId] = useState(TEAM_MEMBERS[0].id);
  const [sections, setSections] = useState<QASection[]>(INITIAL_SECTIONS as QASection[]);

  const handleScoreChange = (sectionIdx: number, itemIdx: number, score: number) => {
    const newSections = [...sections];
    newSections[sectionIdx].items[itemIdx].score = score;
    setSections(newSections);
  };

  const handleTextChange = (sectionIdx: number, field: 'caseRef' | 'comment', value: string) => {
    const newSections = [...sections];
    newSections[sectionIdx][field] = value;
    setSections(newSections);
  };

  const calculateSectionPct = (section: QASection) => {
    const totalPossible = section.items.length * 5;
    const actualScore = section.items.reduce((sum, item) => sum + item.score, 0);
    return totalPossible > 0 ? Math.round((actualScore / totalPossible) * 100) : 0;
  };

  const overallPercentage = useMemo(() => {
    const allItems = sections.flatMap(s => s.items);
    const totalPossible = allItems.length * 5;
    const actualScore = allItems.reduce((sum, item) => sum + item.score, 0);
    return totalPossible > 0 ? Math.round((actualScore / totalPossible) * 100) : 0;
  }, [sections]);

  const generateEmailReport = () => {
    const staff = TEAM_MEMBERS.find(m => m.id === staffId);
    const dateStr = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'long', year: 'numeric' });
    
    let body = `📊 QA PERFORMANCE AUDIT REPORT\n`;
    body += `👤 Staff: ${staff?.name}\n`;
    body += `🏆 OVERALL AUDIT SCORE: ${overallPercentage}%\n\n`;
    
    const recipients = "sai@localforyou.com, aom@localforyou.com";
    const subject = `QA Report: ${staff?.name} - ${dateStr} [${overallPercentage}%]`;
    window.location.href = `mailto:${recipients}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSave = () => {
    const staff = TEAM_MEMBERS.find(m => m.id === staffId);
    const record: QARecord = {
      id: Date.now().toString(),
      staffId,
      staffName: staff?.name || "Unknown",
      date: new Date().toISOString().split('T')[0],
      sections,
      overallPercentage
    };
    onSave(record);
    alert("QA Record Saved Successfully!");
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-blue-600 rounded-[2rem] shadow-lg shadow-blue-500/30"><ClipboardCheck size={40} /></div>
            <div>
              <h2 className="text-4xl font-black tracking-tight">Digital QA Check List</h2>
              <p className="text-slate-400 text-lg mt-1 font-medium italic">Standardized Quality Assurance Monitoring System</p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 flex items-center gap-8 min-w-[280px]">
            <div className="text-right">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Audit Score</p>
              <p className="text-6xl font-black tracking-tighter">{overallPercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-8 items-center justify-between">
        <div className="flex flex-wrap gap-8 items-center">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-slate-100 rounded-2xl"><User size={20} className="text-slate-500" /></div>
             <div>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Staff Member Under Audit</label>
               <select className="bg-transparent font-black text-slate-800 text-lg outline-none cursor-pointer" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
                 {TEAM_MEMBERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
               </select>
             </div>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white font-black px-10 py-4 rounded-2xl shadow-xl transition-all flex items-center gap-3">
            <Save size={20} /> บันทึกผลตรวจ
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {sections.map((section, sIdx) => {
          const sectionPct = calculateSectionPct(section);
          return (
            <div key={sIdx} className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="bg-[#e8f5e9] p-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-600 font-black text-2xl">{sIdx + 1}</div>
                  <h3 className="text-xl font-black text-[#1b5e20] tracking-tight">{section.title}</h3>
                </div>
                <p className="text-4xl font-black text-[#1b5e20] tracking-tighter">{sectionPct}%</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-slate-50">
                    {section.items.map((item, iIdx) => (
                      <tr key={iIdx} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-10 py-8 text-slate-700 font-bold text-[15px] max-w-md">{item.label}</td>
                        <td className="px-10 py-8">
                          <div className="flex justify-center items-center gap-3">
                            {[1, 2, 3, 4, 5].map(score => (
                              <button
                                key={score}
                                onClick={() => handleScoreChange(sIdx, iIdx, score)}
                                className={`w-10 h-10 rounded-xl font-black border-2 ${item.score === score ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QAChecklist;