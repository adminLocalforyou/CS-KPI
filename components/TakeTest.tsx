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
  Info,
  Lock
} from 'lucide-react';
import { AssessmentRecord, TestSubmission } from '../types.ts';
import { TEAM_MEMBERS } from '../constants.tsx';

interface TakeTestProps {
  test?: AssessmentRecord;
  submissions: TestSubmission[];
  onSubmit: (submission: TestSubmission) => void;
}

const TakeTest: React.FC<TakeTestProps> = ({ test, submissions, onSubmit }) => {
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);

  // Check if current user already taken this specific test
  const alreadyTaken = useMemo(() => {
    if (!test || !selectedStaffName) return false;
    return submissions.some(s => s.testId === test.id && s.staffName === selectedStaffName);
  }, [test, selectedStaffName, submissions]);

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

  if (!test) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
      <AlertCircle size={64} className="text-rose-500" />
      <h2 className="text-2xl font-black text-slate-900 uppercase">Exam Not Found</h2>
      <p className="text-slate-400 font-bold">ชุดข้อสอบนี้ไม่มีอยู่จริง หรือถูกลบไปแล้ว</p>
      <button onClick={() => window.location.hash = ''} className="mt-4 px-8 py-3 bg-slate-900 text-white rounded-xl font-black">Return Home</button>
    </div>
  );

  const handleSelectAnswer = (qId: string, answer: string) => {
    if (alreadyTaken) return;
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
    if (!selectedStaffName) {
      alert("กรุณาเลือกชื่อของคุณก่อนส่งข้อสอบ");
      return;
    }

    if (alreadyTaken) {
      alert("คุณได้ทำข้อสอบชุดนี้ไปแล้ว ไม่สามารถส่งซ้ำได้ครับ");
      return;
    }

    // Ensure all questions are answered or confirm
    const totalQuestions = test.questions.length;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < totalQuestions) {
      if (!confirm(`คุณยังทำข้อสอบไม่ครบ (ทำไป ${answeredCount}/${totalQuestions}) ยืนยันจะส่งหรือไม่?`)) {
        return;
      }
    }
    
    const autoScore = calculateAutoScore();
    const totalPossible = test.questions.reduce((acc, curr) => acc + curr.maxPoints, 0);
    const hasWritten = test.questions.some(q => q.type === 'written');

    const submission: TestSubmission = {
      id: `${Date.now()}-${selectedStaffName}`,
      testId: test.id,
      testTitle: test.title,
      staffName: selectedStaffName,
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
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">พนักงาน: {selectedStaffName}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">Calculated Score (Choices Only)</p>
            <div className="text-7xl font-black tracking-tighter text-indigo-600">
              {autoScore}<span className="text-slate-200">/{totalMax}</span>
            </div>
            
            {hasWritten && (
              <div className="mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-4 text-left">
                <AlertCircle className="text-amber-600 flex-shrink-0" />
                <p className="text-sm font-bold text-amber-800">เนื่องจากคุณมีคำถามส่วน "ข้อเขียน" หัวหน้าจะมาตรวจให้คะแนนส่วนที่เหลือและแจ้งคะแนนสรุปอีกครั้งภายหลังครับ ข้อมูลได้ถูกส่งเข้า Grading Desk แล้ว</p>
              </div>
            )}
          </div>
          <button onClick={() => { window.location.hash = ''; window.location.reload(); }} className="text-indigo-200 font-bold hover:text-white transition-colors">← Back to Portal</button>
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
        <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200 min-w-[280px]">
          <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600"><User size={18} /></div>
          <select 
            className="bg-transparent font-black text-slate-800 outline-none w-full text-sm cursor-pointer" 
            value={selectedStaffName} 
            onChange={(e) => setSelectedStaffName(e.target.value)}
          >
            <option value="">-- เลือกชื่อของคุณ (Prefill) --</option>
            {TEAM_MEMBERS.map(m => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
        </div>
      </header>

      {selectedStaffName && alreadyTaken ? (
        <div className="max-w-4xl mx-auto px-8 py-20 flex flex-col items-center justify-center text-center space-y-6">
           <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shadow-lg"><Lock size={40} /></div>
           <h2 className="text-3xl font-black text-slate-900">Access Restricted</h2>
           <p className="text-slate-500 font-bold max-w-md">พนักงานชื่อ <span className="text-rose-500 font-black">"{selectedStaffName}"</span> ได้ทำข้อสอบชุดนี้เรียบร้อยแล้ว ไม่สามารถทำการสอบซ้ำได้ตามนโยบายบริษัท</p>
           <button onClick={() => setSelectedStaffName('')} className="text-blue-600 font-black hover:underline uppercase text-xs tracking-widest">Select Different Name</button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-8 py-12 space-y-12">
          {!selectedStaffName && (
             <div className="bg-blue-600 p-10 rounded-[3rem] text-white flex items-center justify-between gap-10 shadow-2xl shadow-blue-500/30">
                <div className="space-y-2">
                   <h3 className="text-2xl font-black">Welcome to Assessment!</h3>
                   <p className="font-bold text-blue-100 italic opacity-80 text-sm">กรุณาเลือกชื่อของคุณที่มุมขวาบนเพื่อเริ่มต้นทำข้อสอบ</p>
                </div>
                <Info size={48} className="opacity-20 rotate-12" />
             </div>
          )}

          <div className={!selectedStaffName ? 'opacity-20 pointer-events-none blur-[2px] transition-all' : 'transition-all'}>
            {test.questions.map((q, qIdx) => (
              <div key={q.id} className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm mb-8 last:mb-0">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">{qIdx + 1}</div>
                  <div className="flex-1 space-y-6">
                    <h3 className="text-xl font-bold text-slate-800 leading-relaxed">{q.question}</h3>
                    
                    {q.type === 'choice' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shuffledOptions[q.id]?.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectAnswer(q.id, opt)}
                            className={`p-6 rounded-3xl text-left font-bold transition-all border-2 ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <textarea 
                          rows={4}
                          className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-500 transition-all"
                          placeholder="พิมพ์คำอธิบายของคุณที่นี่..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleSelectAnswer(q.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-10 flex flex-col items-center gap-6">
               <button 
                 onClick={handleFinish}
                 className="px-20 py-8 bg-indigo-600 text-white rounded-[3rem] font-black text-xl shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-4 active:scale-95"
               >
                 <Send size={24} /> ส่งข้อสอบเข้าระบบ Grading Desk
               </button>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">กรุณาตรวจสอบข้อมูลให้เรียบร้อยก่อนส่ง เนื่องจากทำได้เพียงครั้งเดียวเท่านั้น</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeTest;