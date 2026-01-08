import React, { useState, useMemo } from 'react';
import { 
  Award, 
  CheckCircle2, 
  ChevronRight, 
  Send, 
  User, 
  AlertCircle, 
  HelpCircle, 
  Timer,
  GraduationCap,
  PenTool,
  Info
} from 'lucide-react';
import { AssessmentRecord, TestSubmission } from '../types.ts';

interface TakeTestProps {
  test?: AssessmentRecord;
  onSubmit: (submission: TestSubmission) => void;
}

const TakeTest: React.FC<TakeTestProps> = ({ test, onSubmit }) => {
  const [staffName, setStaffName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  const shuffledOptions = useMemo(() => {
    if (!test) return {};
    const options: Record<string, string[]> = {};
    test.questions.forEach(q => {
      if (q.type === 'choice') {
        const all = [q.correctAnswer, ...(q.distractors || [])].filter(Boolean) as string[];
        options[q.id] = all.sort(() => Math.random() - 0.5);
      }
    });
    return options;
  }, [test]);

  if (!test) return null;

  const handleSelect = (qId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const calculateAutoScore = () => {
    let score = 0;
    test.questions.forEach(q => {
      if (q.type === 'choice' && answers[q.id] === q.correctAnswer) {
        score += q.maxPoints;
      }
    });
    return score;
  };

  const handleFinish = () => {
    if (!staffName) {
      alert("กรุณาระบุชื่อของคุณก่อนส่งข้อสอบ");
      return;
    }
    
    const autoScore = calculateAutoScore();
    const totalPossible = test.questions.reduce((acc, curr) => acc + curr.maxPoints, 0);
    const hasWritten = test.questions.some(q => q.type === 'written');

    const submission: TestSubmission = {
      id: Date.now().toString(),
      testId: test.id,
      testTitle: test.title,
      staffName,
      autoScore: autoScore,
      manualScore: 0,
      totalPossiblePoints: totalPossible,
      isGraded: !hasWritten, // Auto graded if no written questions
      date: new Date().toLocaleDateString('th-TH'),
      answers
    };

    setIsFinished(true);
    onSubmit(submission);
  };

  if (isFinished) {
    const autoScore = calculateAutoScore();
    const hasWritten = test.questions.some(q => q.type === 'written');
    const totalMax = test.questions.reduce((a, b) => a + b.maxPoints, 0);

    return (
      <div className="min-h-screen bg-indigo-900 text-white flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
        <div className="bg-white/10 p-10 rounded-[4rem] backdrop-blur-xl border border-white/10 max-w-2xl w-full">
          <Award size={80} className="mx-auto text-yellow-400 mb-6" />
          <h2 className="text-4xl font-black mb-6">Submission Success!</h2>
          
          <div className="bg-white rounded-[2.5rem] p-10 text-slate-900 shadow-2xl mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Calculated Score (Choices Only)</p>
            <div className="text-7xl font-black tracking-tighter text-indigo-600">
              {autoScore}<span className="text-slate-200">/{totalMax}</span>
            </div>
            
            {hasWritten && (
              <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4 text-left">
                <AlertCircle className="text-amber-600 flex-shrink-0" />
                <p className="text-sm font-bold text-amber-800">เนื่องจากคุณมีคำถามส่วน "ข้อเขียน" หัวหน้าจะมาตรวจให้คะแนนส่วนที่เหลือและแจ้งคะแนนสรุปอีกครั้งภายหลังครับ</p>
              </div>
            )}
          </div>
          <button onClick={() => window.location.hash = ''} className="text-indigo-200 font-bold hover:text-white transition-colors">← Back to Main Menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-8 py-6 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg"><GraduationCap size={24} /></div>
          <div><h1 className="text-xl font-black text-slate-900">{test.title}</h1><span className="text-xs text-slate-400 font-bold uppercase">{test.topic}</span></div>
        </div>
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
          <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600"><User size={18} /></div>
          <input type="text" placeholder="Your Name..." className="bg-transparent font-black text-slate-800 outline-none w-48" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-8 py-12 space-y-12">
        {test.questions.map((q, qIdx) => (
          <div key={q.id} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">{qIdx + 1}</div>
              <div className="flex-1 space-y-6">
                <h3 className="text-xl font-bold text-slate-800 leading-relaxed">{q.question}</h3>
                
                {q.type === 'choice' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {shuffledOptions[q.id]?.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelect(q.id, opt)}
                        className={`p-6 rounded-3xl text-left font-bold transition-all border-2 ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-600 text-[10px] font-black uppercase tracking-widest"><PenTool size={14} /> Short Answer / เขียนอธิบาย</div>
                    <textarea 
                      rows={4}
                      className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 font-bold text-slate-700 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      placeholder="Type your answer here..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleSelect(q.id, e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="flex flex-col items-center pt-10">
          <button onClick={handleFinish} className="bg-slate-900 hover:bg-black text-white px-20 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl flex items-center gap-4 transition-all">
            <Send size={24} /> FINISH & SUBMIT TEST
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;