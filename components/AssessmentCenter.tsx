
import React, { useState } from 'react';
import { 
  GraduationCap, 
  BrainCircuit, 
  Save, 
  Trash2, 
  Zap, 
  PenTool,
  ListChecks,
  ExternalLink,
  ChevronRight,
  Clipboard,
  Check,
  Loader2,
  Edit,
  Plus,
  Share2,
  Copy
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentRecord, TestQuestion, QuestionType } from '../types.ts';

interface AssessmentCenterProps {
  assessments: AssessmentRecord[];
  onSave: (record: AssessmentRecord) => void;
  onTakeTest: (id: string) => void;
  onDelete: (id: string) => void;
}

const AssessmentCenter: React.FC<AssessmentCenterProps> = ({ assessments, onSave, onTakeTest, onDelete }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const startCreate = () => {
    setEditingId(null);
    setTitle('');
    setTopic('');
    setQuestions([]);
    setIsCreating(true);
  };

  const startEdit = (a: AssessmentRecord) => {
    setEditingId(a.id);
    setTitle(a.title);
    setTopic(a.topic);
    setQuestions(JSON.parse(JSON.stringify(a.questions))); 
    setIsCreating(true);
  };

  const addQuestion = (type: QuestionType = 'choice') => {
    const newQuestion: TestQuestion = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      question: '',
      correctAnswer: type === 'choice' ? '' : undefined,
      distractors: type === 'choice' ? ['', '', ''] : undefined,
      maxPoints: type === 'choice' ? 1 : 5
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const updateQuestion = (id: string, field: keyof TestQuestion, value: any) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const cleanAIResponse = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
  };

  const generateDistractorsWithAI = async (qId: string) => {
    const q = questions.find(item => item.id === qId);
    if (!q || !q.question || !q.correctAnswer) {
      alert("กรุณากรอก 'คำถาม' และ 'คำตอบที่ถูกต้อง' ก่อนเพื่อให้ AI ช่วยคิดครับ");
      return;
    }

    setIsGenerating(qId);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `ในฐานะผู้เชี่ยวชาญด้านการจัดอบรมพนักงาน ช่วยคิด "ตัวเลือกที่ผิด" 3 ข้อ สำหรับคำถาม: "${q.question}" และคำตอบที่ถูกคือ: "${q.correctAnswer}" ตอบเป็น JSON Array ของ String ภาษาไทยเท่านั้น`;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const cleanedJson = cleanAIResponse(response.text || "[]");
      const distractors = JSON.parse(cleanedJson);

      if (Array.isArray(distractors) && distractors.length > 0) {
        updateQuestion(qId, 'distractors', distractors.slice(0, 3));
      }
    } catch (error: any) {
      alert("AI Error: " + error.message);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleSaveAssessment = () => {
    if (!title || !topic || questions.length === 0) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วนครับ");
      return;
    }
    const record: AssessmentRecord = {
      id: editingId || Date.now().toString(),
      title,
      topic,
      date: new Date().toLocaleDateString('th-TH'),
      questions
    };
    onSave(record);
    setIsCreating(false);
  };

  const getEncodedData = (record: AssessmentRecord) => {
    return btoa(encodeURIComponent(JSON.stringify(record)));
  };

  const handleCopyLink = (record: AssessmentRecord) => {
    try {
      // 1. หา Origin ที่แท้จริง (ตัด blob: และส่วนเกินออก)
      let origin = window.location.origin;
      let pathname = window.location.pathname;

      if (origin === 'null' || origin.startsWith('blob:')) {
        // กรณีรันใน Sandbox หรือ Blob, พยายามดึงจาก href
        const hrefParts = window.location.href.split('/');
        // พยายามหาส่วนที่เป็น https://...
        const httpsIndex = hrefParts.findIndex(p => p.startsWith('https:'));
        if (httpsIndex !== -1 && hrefParts[httpsIndex + 2]) {
           origin = `${hrefParts[httpsIndex]}//${hrefParts[httpsIndex + 2]}`;
        } else {
           // Fallback สุดท้าย: ใช้ origin ของหน้าปัจจุบันและล้างคำว่า blob:
           origin = window.location.origin.replace('blob:', '');
        }
      }

      // ป้องกันการสะกดผิด googhttps
      origin = origin.replace('googhttps', 'goog');
      
      // ล้าง pathname
      if (pathname === 'null' || pathname.includes('blob:')) pathname = '/';
      if (!pathname.endsWith('/')) pathname += '/';

      const examData = getEncodedData(record);
      const examLink = `${origin}${pathname}#import=${examData}`;
      
      navigator.clipboard.writeText(examLink);
      setCopiedId(record.id);
      setTimeout(() => setCopiedId(null), 2000);
      alert("คัดลอกลิงก์สำเร็จ! หากส่งลิงก์แล้วทีมงานเข้าไม่ได้ ให้ใช้ปุ่ม 'Copy Code' ส่งทางแชทแทนนะครับ");
    } catch (err) {
      alert("ไม่สามารถสร้างลิงก์ได้ กรุณาใช้ปุ่ม 'Copy Code' แทนครับ");
    }
  };

  const handleCopyCode = (record: AssessmentRecord) => {
    try {
      const examData = getEncodedData(record);
      navigator.clipboard.writeText(examData);
      setCopiedCodeId(record.id);
      setTimeout(() => setCopiedCodeId(null), 2000);
      alert("คัดลอก 'รหัสข้อสอบ' สำเร็จ! \n\nส่งรหัสนี้ให้ทีมงานทางแชทได้เลยครับ");
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการคัดลอก");
    }
  };

  if (isCreating) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 pb-20">
        <div className="flex items-center justify-between">
          <button onClick={() => { setIsCreating(false); setEditingId(null); }} className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-slate-900 transition-colors">← Back to List</button>
          <div className="px-6 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
            {editingId ? 'Edit Mode: อัปเดตข้อสอบเดิม' : 'Create Mode: สร้างข้อสอบใหม่'}
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-end">
          <div className="flex-1 space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Assessment Title</label>
            <input type="text" placeholder="ชื่อชุดข้อสอบ" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-black text-slate-800 outline-none" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex-1 space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Topic / Category</label>
            <input type="text" placeholder="หมวดหมู่" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-black text-slate-800 outline-none" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <button onClick={handleSaveAssessment} className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black shadow-xl h-[58px] flex items-center gap-2 transition-all">
            <Save size={20} /> Save Assessment
          </button>
        </div>

        <div className="space-y-8">
          {questions.map((q, qIdx) => (
            <div key={q.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 space-y-8 group transition-all hover:border-indigo-200">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${q.type === 'choice' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                     {q.type === 'choice' ? 'Multiple Choice' : 'Written Essay'}
                   </span>
                   <span className="font-black text-slate-400 uppercase tracking-widest">Question {qIdx+1}</span>
                 </div>
                 <button onClick={() => removeQuestion(q.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20} /></button>
               </div>
               <textarea className="w-full bg-slate-50 border-2 border-slate-100 p-6 rounded-[2rem] font-bold outline-none focus:border-indigo-500 transition-all text-xl" placeholder="พิมพ์คำถาม..." value={q.question} onChange={(e) => updateQuestion(q.id, 'question', e.target.value)} />
               {q.type === 'choice' && (
                 <div className="space-y-4">
                   <div className="flex gap-4 items-center">
                     <div className="flex-1 bg-emerald-50 border-2 border-emerald-100 p-5 rounded-2xl flex items-center gap-3">
                       <Check size={18} className="text-emerald-500" />
                       <input className="bg-transparent w-full font-black text-emerald-800 outline-none" placeholder="คำตอบที่ถูก" value={q.correctAnswer} onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)} />
                     </div>
                     <button onClick={() => generateDistractorsWithAI(q.id)} disabled={isGenerating === q.id} className="bg-indigo-600 text-white p-5 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center gap-2">
                       {isGenerating === q.id ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                       <span className="hidden md:inline font-black text-xs uppercase tracking-widest">AI Choice</span>
                     </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {q.distractors?.map((d, dIdx) => (
                       <input key={dIdx} className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 outline-none text-sm font-bold" placeholder={`ช้อยส์หลอก ${dIdx + 1}`} value={d} onChange={(e) => {
                         const newDist = [...(q.distractors || [])];
                         newDist[dIdx] = e.target.value;
                         updateQuestion(q.id, 'distractors', newDist);
                       }} />
                     ))}
                   </div>
                 </div>
               )}
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => addQuestion('choice')} className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-12 flex flex-col items-center text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-all">
              <ListChecks size={32} className="mb-4" />
              <span className="font-black uppercase tracking-widest text-sm">+ Multiple Choice</span>
            </button>
            <button onClick={() => addQuestion('written')} className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-12 flex flex-col items-center text-slate-400 hover:border-amber-400 hover:text-amber-400 transition-all">
              <PenTool size={32} className="mb-4" />
              <span className="font-black uppercase tracking-widest text-sm">+ Written Essay</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-lg"><GraduationCap size={40} /></div>
          <div>
            <h2 className="text-4xl font-black tracking-tight">Assessment Hub</h2>
            <p className="text-slate-400 text-lg mt-1 font-medium italic">จัดการแบบทดสอบและแชร์ลิงก์ให้ทีม</p>
          </div>
        </div>
        <button onClick={startCreate} className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl transition-all flex items-center gap-2">
           <Plus size={18}/> Create New Exam
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assessments.map((a) => (
          <div key={a.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 group relative hover:border-indigo-300 transition-all">
             <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">{a.topic}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => startEdit(a)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit size={16}/></button>
                  <button onClick={() => onDelete(a.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                </div>
             </div>
             <div className="min-h-[60px]">
                <h4 className="text-2xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{a.title}</h4>
                <p className="text-xs text-slate-400 font-bold mt-1">{a.date}</p>
             </div>
             <div className="pt-6 border-t border-slate-50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                   <div className="flex gap-3">
                      <button 
                        onClick={() => handleCopyLink(a)} 
                        title="คัดลอกลิงก์ URL"
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${copiedId === a.id ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-900'}`}
                      >
                        {copiedId === a.id ? <Check size={14}/> : <Clipboard size={14}/>} 
                        {copiedId === a.id ? 'Copied' : 'Get Link'}
                      </button>
                      <button 
                        onClick={() => handleCopyCode(a)} 
                        title="คัดลอกเฉพาะรหัสข้อมูล (กรณีลิงก์เสีย)"
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${copiedCodeId === a.id ? 'text-emerald-500' : 'text-slate-400 hover:text-indigo-600'}`}
                      >
                        {copiedCodeId === a.id ? <Check size={14}/> : <Copy size={14}/>} 
                        {copiedCodeId === a.id ? 'Code Copied' : 'Copy Code'}
                      </button>
                   </div>
                   <button onClick={() => onTakeTest(a.id)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700">
                      <ExternalLink size={14}/> Preview
                   </button>
                </div>
                <div className="text-[10px] font-black text-slate-300 flex justify-end">{a.questions.length} Questions</div>
             </div>
          </div>
        ))}
      </div>
      
      {assessments.length === 0 && (
        <div className="py-20 text-center border-4 border-dashed border-slate-100 rounded-[3rem] text-slate-300">
           <ListChecks size={48} className="mx-auto mb-4" />
           <p className="font-black uppercase tracking-widest">ยังไม่มีชุดข้อสอบในระบบ</p>
        </div>
      )}
    </div>
  );
};

export default AssessmentCenter;
