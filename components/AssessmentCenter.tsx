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
  Check
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
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const generateDistractorsWithAI = async (qId: string) => {
    const q = questions.find(item => item.id === qId);
    if (!q || !q.question || !q.correctAnswer) {
      alert("กรุณาใส่ 'คำถาม' และ 'คำตอบที่ถูก' ก่อนกดให้ AI ช่วยคิดช้อยส์หลอก!");
      return;
    }

    setIsGenerating(qId);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Given the question: "${q.question}" and the correct answer: "${q.correctAnswer}", generate 3 plausible but incorrect multiple-choice options (distractors). JSON array format exactly 3 strings in Thai language.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const distractors = JSON.parse(response.text.trim());
      if (Array.isArray(distractors)) {
        updateQuestion(qId, 'distractors', distractors.slice(0, 3));
      }
    } catch (error) {
      console.error("AI Generation failed:", error);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleSaveAssessment = () => {
    if (!title || !topic || questions.length === 0) {
      alert("กรุณาใส่ข้อมูลให้ครบ");
      return;
    }
    const record: AssessmentRecord = {
      id: Date.now().toString(),
      title,
      topic,
      date: new Date().toISOString().split('T')[0],
      questions
    };
    onSave(record);
    setTitle('');
    setTopic('');
    setQuestions([]);
    setIsCreating(false);
    alert("บันทึกชุดข้อสอบสำเร็จ!");
  };

  const handleCopyLink = (id: string) => {
    const fakeLink = `https://cs-portal.app/exam/${id}`;
    navigator.clipboard.writeText(fakeLink);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isCreating) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500">
        <button onClick={() => setIsCreating(false)} className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">← Back to Assessment List</button>
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-end">
          <div className="flex-1 space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Assessment Title</label>
            <input type="text" placeholder="e.g. Monthly QA Audit (January)" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-black text-slate-800 outline-none" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="flex-1 space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Topic / Category</label>
            <input type="text" placeholder="e.g. System Knowledge" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-black text-slate-800 outline-none" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <button onClick={handleSaveAssessment} className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black shadow-xl h-[58px] flex items-center gap-2">
            <Save size={20} /> Save Assessment
          </button>
        </div>

        <div className="space-y-8">
          {questions.map((q, qIdx) => (
            <div key={q.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 space-y-8">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${q.type === 'choice' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                     {q.type === 'choice' ? 'Multiple Choice' : 'Written Essay'}
                   </span>
                   <span className="font-black text-slate-400 uppercase tracking-widest">Question {qIdx+1}</span>
                 </div>
                 <button onClick={() => removeQuestion(q.id)} className="p-3 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
               </div>
               <textarea className="w-full bg-slate-50 border p-6 rounded-[2rem] font-bold outline-none" placeholder="Enter question..." value={q.question} onChange={(e) => updateQuestion(q.id, 'question', e.target.value)} />
               {q.type === 'choice' ? (
                 <div className="space-y-4">
                   <div className="flex gap-4 items-center">
                     <div className="flex-1 bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-3">
                       <Check size={18} className="text-emerald-500" />
                       <input className="bg-transparent w-full font-black text-emerald-800 outline-none" placeholder="Correct Answer (Correct Choice)" value={q.correctAnswer} onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)} />
                     </div>
                     <button 
                        onClick={() => generateDistractorsWithAI(q.id)} 
                        disabled={isGenerating === q.id}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl shadow-lg transition-all disabled:opacity-50"
                     >
                       <Zap size={20} className={isGenerating === q.id ? 'animate-pulse' : ''} />
                     </button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     {q.distractors?.map((d, dIdx) => (
                       <div key={dIdx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                         <input 
                           className="bg-transparent w-full text-xs font-bold text-slate-500 outline-none" 
                           placeholder={`Distractor ${dIdx + 1}`} 
                           value={d} 
                           onChange={(e) => {
                             const newDist = [...(q.distractors || [])];
                             newDist[dIdx] = e.target.value;
                             updateQuestion(q.id, 'distractors', newDist);
                           }} 
                         />
                       </div>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Essay View: This will be manually graded by a Supervisor.</p>
                 </div>
               )}
            </div>
          ))}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => addQuestion('choice')} className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-10 flex flex-col items-center text-slate-400 hover:border-indigo-400 hover:text-indigo-400 transition-all">
              <ListChecks size={32} />
              <span className="font-black uppercase tracking-widest mt-2">+ Multiple Choice</span>
            </button>
            <button onClick={() => addQuestion('written')} className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-10 flex flex-col items-center text-slate-400 hover:border-amber-400 hover:text-amber-400 transition-all">
              <PenTool size={32} />
              <span className="font-black uppercase tracking-widest mt-2">+ Written Essay</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div className="flex items-center gap-6">
          <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-lg shadow-indigo-500/30"><GraduationCap size={40} /></div>
          <div>
            <h2 className="text-4xl font-black tracking-tight">Assessment Hub</h2>
            <p className="text-slate-400 text-lg mt-1 font-medium italic">Create and manage bi-monthly performance exams</p>
          </div>
        </div>
        <button onClick={() => setIsCreating(true)} className="px-10 py-5 bg-white text-slate-900 rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-all">
           + Create New Exam
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assessments.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-[3.5rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 space-y-4">
             <BrainCircuit size={64} />
             <p className="font-black uppercase tracking-[0.2em]">No exams created yet</p>
          </div>
        ) : (
          assessments.map((a) => (
            <div key={a.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 group relative">
               <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest">{a.topic}</span>
                  <button onClick={() => onDelete(a.id)} className="p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
               </div>
               <div>
                  <h4 className="text-2xl font-black text-slate-900 leading-tight">{a.title}</h4>
                  <p className="text-xs text-slate-400 font-bold mt-1">{a.date}</p>
               </div>
               <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleCopyLink(a.id)} 
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${copiedId === a.id ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-900'}`}
                    >
                      {copiedId === a.id ? <Check size={14}/> : <Clipboard size={14}/>} 
                      {copiedId === a.id ? 'Copied' : 'Get Link'}
                    </button>
                    <button onClick={() => onTakeTest(a.id)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700">
                      <ExternalLink size={14}/> Preview
                    </button>
                  </div>
                  <span className="text-[10px] font-black text-slate-300">{a.questions.length} Questions</span>
               </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssessmentCenter;