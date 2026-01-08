import React, { useState } from 'react';
import { 
  GraduationCap, 
  BrainCircuit, 
  Save, 
  Trash2, 
  Zap, 
  Loader2,
  Trash,
  PlusCircle,
  PenTool,
  ListChecks
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { AssessmentRecord, TestQuestion, QuestionType } from '../types.ts';

interface AssessmentCenterProps {
  onSave: (record: AssessmentRecord) => void;
}

const AssessmentCenter: React.FC<AssessmentCenterProps> = ({ onSave }) => {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const addQuestion = (type: QuestionType = 'choice') => {
    const newQuestion: TestQuestion = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      question: '',
      correctAnswer: type === 'choice' ? '' : undefined,
      distractors: type === 'choice' ? ['', '', ''] : undefined,
      maxPoints: 1
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
        contents: `Given the question: "${q.question}" and the correct answer: "${q.correctAnswer}", generate 3 plausible but incorrect multiple-choice options (distractors). JSON array format exactly 3 strings.`,
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
    alert("บันทึกชุดข้อสอบสำเร็จ!");
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-black rounded-[3rem] p-12 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-lg shadow-indigo-500/30"><BrainCircuit size={40} /></div>
            <div>
              <h2 className="text-4xl font-black tracking-tight uppercase">Assessment Creator</h2>
              <p className="text-indigo-300 text-lg mt-1 font-medium italic">Hybrid Test Builder (Choice + Written)</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-8 items-end">
        <div className="flex-1 space-y-4">
          <label className="text-xs font-black text-slate-400 uppercase tracking-widest block ml-1">Assessment Title</label>
          <input type="text" placeholder="e.g. Monthly QA Audit" className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-6 font-black text-slate-800 outline-none transition-all" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <button onClick={handleSaveAssessment} className="bg-slate-900 hover:bg-black text-white px-10 py-4 rounded-2xl font-black shadow-xl transition-all h-[58px]">
          <Save size={20} /> Save Assessment
        </button>
      </div>

      <div className="space-y-8">
        {questions.map((q, qIdx) => (
          <div key={q.id} className="bg-white rounded-[3.5rem] border border-slate-100 shadow-sm p-10 space-y-8">
             <div className="flex justify-between items-center">
               <span className="font-black text-indigo-600 uppercase tracking-widest">Question {qIdx+1} ({q.type})</span>
               <button onClick={() => removeQuestion(q.id)} className="p-3 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
             </div>
             <textarea className="w-full bg-slate-50 border p-6 rounded-[2rem] font-bold outline-none" placeholder="Enter question..." value={q.question} onChange={(e) => updateQuestion(q.id, 'question', e.target.value)} />
             {q.type === 'choice' && (
               <div className="flex gap-4 items-center">
                 <input className="flex-1 bg-emerald-50 border-emerald-100 p-4 rounded-xl font-black outline-none" placeholder="Correct Answer" value={q.correctAnswer} onChange={(e) => updateQuestion(q.id, 'correctAnswer', e.target.value)} />
                 <button onClick={() => generateDistractorsWithAI(q.id)} className="bg-indigo-600 text-white p-4 rounded-xl"><Zap size={20}/></button>
               </div>
             )}
          </div>
        ))}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={() => addQuestion('choice')} className="bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-10 flex flex-col items-center text-slate-400 hover:border-blue-400 hover:text-blue-400 transition-all">
            <ListChecks size={32} />
            <span className="font-black uppercase tracking-widest mt-2">+ Multiple Choice</span>
          </button>
          <button onClick={() => addQuestion('written')} className="bg-white border-4 border-dashed border-slate-200 rounded-[3rem] p-10 flex flex-col items-center text-slate-400 hover:border-amber-400 hover:text-amber-400 transition-all">
            <PenTool size={32} />
            <span className="font-black uppercase tracking-widest mt-2">+ Written Question</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssessmentCenter;