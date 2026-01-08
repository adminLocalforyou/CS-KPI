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
  Lock,
  XCircle,
  Check,
  ArrowLeft,
  FileText,
  Clock
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
      <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 md:p-12 animate-in fade-in duration-500 overflow-y-auto">
        <div className="max-w-4xl w-full space-y-10">
          {/* Header Card */}
          <div className="bg-indigo-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden text-center">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12"><Award size={200} /></div>
            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 bg-yellow-400 text-indigo-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-4xl font-black tracking-tight">คุณส่งข้อสอบเรียบร้อยแล้ว!</h2>
              <p className="text-indigo-200 font-bold">ขอบคุณที่ตั้งใจทำข้อสอบครับ {selectedStaffName}</p>
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="bg-white rounded-[3.5rem] p-10 shadow-xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1 text-center md:text-left space-y-2">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Calculated Choice Score</p>
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-7xl font-black text-indigo-600 tracking-tighter">{autoScore}</span>
                <span className="text-2xl font-black text-slate-200">/ {totalMax}</span>
              </div>
            </div>
            
            {hasWritten && (
              <div className="flex-1 bg-amber-50 p-8 rounded-[2.5rem] border border-amber-100 flex items-start gap-5">
                <div className="p-3 bg-white rounded-2xl shadow-sm text-amber-500 flex-shrink-0">
                  <Clock size={24} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-amber-900 uppercase">Pending Review</h4>
                  <p className="text-[13px] font-bold text-amber-700 leading-relaxed">
                    มีส่วนที่เป็น <span className="text-amber-900">"ข้อเขียน"</span> รอ supervisor ตรวจสอบ จะมีการอัปเดตผลสรุปที่เมนู Exam Review ภายหลังครับ
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Immediate Review Section */}
          <div className="space-y-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 px-6">
              <FileText className="text-blue-500" /> ตรวจทานผลการตอบ (Immediate Review)
            </h3>

            {test.questions.map((q, idx) => {
              const userAnswer = answers[q.id];
              const isCorrect = q.type === 'choice' ? userAnswer === q.correctAnswer : null;

              return (
                <div key={q.id} className={`bg-white rounded-[2.5rem] p-8 border shadow-sm transition-all ${isCorrect === true ? 'border-emerald-100' : isCorrect === false ? 'border-rose-100' : 'border-slate-100'}`}>
                  <div className="flex items-start gap-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${isCorrect === true ? 'bg-emerald-500 text-white' : isCorrect === false ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1 space-y-6">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-800 text-lg leading-relaxed">{q.question}</h4>
                        <div className="shrink-0">
                          {q.type === 'choice' ? (
                            isCorrect ? (
                              <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] bg-emerald-50 px-3 py-1 rounded-full">
                                <Check size={14} /> Correct
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-rose-600 font-black uppercase text-[10px] bg-rose-50 px-3 py-1 rounded-full">
                                <XCircle size={14} /> Incorrect
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600 font-black uppercase text-[10px] bg-amber-50 px-3 py-1 rounded-full">
                              <PenTool size={14} /> Manual Grading
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">คำตอบของคุณ</p>
                          <div className={`p-4 rounded-2xl text-sm font-bold ${isCorrect === true ? 'bg-emerald-50 text-emerald-800' : isCorrect === false ? 'bg-rose-50 text-rose-800' : 'bg-slate-50 text-slate-700'}`}>
                            {userAnswer || '(ไม่ได้ตอบ)'}
                          </div>
                        </div>

                        {q.type === 'choice' && !isCorrect && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">คำตอบที่ถูกต้อง (เฉลย)</p>
                            <div className="p-4 bg-slate-900 rounded-2xl text-sm font-black text-white shadow-lg">
                              {q.correctAnswer}
                            </div>
                          </div>
                        )}

                        {q.type === 'written' && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">สถานะการตรวจ</p>
                            <div className="p-4 bg-white border border-amber-100 rounded-2xl text-xs font-bold text-amber-600 flex items-center gap-2 italic">
                              <Info size={14} /> รอ Supervisor ให้คะแนนตามเกณฑ์ BARS
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-10">
            <button 
              onClick={() => { window.location.hash = ''; window.location.reload(); }} 
              className="flex items-center gap-3 px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-95"
            >
              <ArrowLeft size={18} /> Return to Portal Home
            </button>
          </div>
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