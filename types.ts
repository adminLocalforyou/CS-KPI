
export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export type ProjectSubCategory = 'Restaurant' | 'Massage' | 'AI Receptionist';
export type QuestionType = 'choice' | 'written';

export interface GrowthMetrics {
  retention: {
    startCount: number;
    endCount: number;
    newCount: number;
  };
  returnRate: {
    returningCount: number;
    totalCount: number;
  };
}

export interface ProofRecord {
  id: string;
  staffId: string;
  date: string;
  description: string;
  imageUrl?: string; // Base64 string
  category: 'Positive' | 'Improvement' | 'Internal Note';
}

export interface PeerReviewRecord {
  id: string;
  targetStaffId: string;
  reviewerName: string; // Optional or Anonymous
  date: string;
  timestamp: string;
  teamworkScore: number;
  helpfulnessScore: number;
  communicationScore: number;
  comment: string;
}

export interface SLASnapshot {
  id: string;
  monthYear: string;
  restaurantPct: number;
  massagePct: number;
  aiPct: number;
  restaurantRaw: { total: number; met: number };
  massageRaw: { total: number; met: number };
  aiRaw: { total: number; met: number };
}

export interface QAItem {
  label: string;
  score: number; // 1-5
}

export interface QASection {
  title: string;
  items: QAItem[];
  caseRef: string;
  comment: string;
}

export interface QARecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  sections: QASection[];
  overallPercentage: number;
}

export interface TestQuestion {
  id: string;
  type: QuestionType;
  question: string;
  correctAnswer?: string; // For choice
  distractors?: string[]; // For choice
  maxPoints: number; // Points for this question
}

export interface AssessmentRecord {
  id: string;
  title: string;
  date: string;
  topic: string;
  questions: TestQuestion[];
}

export interface TestSubmission {
  id: string;
  testId: string;
  testTitle: string;
  staffName: string;
  autoScore: number; // Score from choice
  manualScore: number; // Score from written (initially 0)
  totalPossiblePoints: number;
  isGraded: boolean; // False if has pending written questions
  date: string;
  answers: Record<string, string>;
  managerFeedback?: string;
}

export interface EvaluationRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  type: 'Project' | 'Maintenance' | 'SideTask';
  projectSubCategory?: ProjectSubCategory;
  
  communicationScore: number; 
  speedScore: number;        
  followUpScore: number;     
  clarityScore: number;      
  processCompliance: number; 
  onboardingQuality: number; 
  
  daysToLive: number;
  metSlaCount?: number;       
  monthlyLiveCount?: number;  
  stepsCompleted: number;
  
  // Workload Metrics
  incomingCalls: number;
  outgoingCalls: number;
  totalChats: number;
  totalTasks: number;
  
  issuesResolved: number;
  customerFeedback: number; 
  
  sideTaskPoints: number;
  
  note: string;
}
