
export interface StaffMember {
  id: string;
  name: string;
  role: string;
}

export type ProjectSubCategory = 'Restaurant' | 'Massage' | 'AI Receptionist';
export type QuestionType = 'choice' | 'written';

export interface TaskConfig {
  id: string;
  name: string;
  minutes: number;
}

export interface WorkHistoryRecord {
  id: string;
  description: string;
  owner: string;
  date: string;
  category: string;
  minutes: number;
  uploadedAt: string;
}

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

// Fixed: Added QAItem and QASection interfaces
export interface QAItem {
  label: string;
  score: number;
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

// Fixed: Added TestQuestion interface
export interface TestQuestion {
  id: string;
  type: QuestionType;
  question: string;
  correctAnswer?: string;
  distractors?: string[];
  maxPoints: number;
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
  autoScore: number;
  manualScore: number;
  totalPossiblePoints: number;
  isGraded: boolean;
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
  
  slaMetCount: number;
  slaTotalBase: number;
  individualSlaPct: number;
  responseTimeMin: number;
  projectCount: number;
  
  latestTestScore?: number;
  daysToLive: number;
  stepsCompleted: number;
  
  incomingCalls: number;
  outgoingCalls: number;
  totalChats: number;
  totalTasks: number;
  
  issuesResolved: number;
  customerFeedback: number; 
  
  sideTaskPoints: number;
  
  note: string;
}

export interface MonthlySnapshotRecord {
  id: string;
  type: 'monthly_snapshot';
  date: string;
  monthYear: string;
  projectSLA: {
    restaurant: { total: number; met: number };
    massage: { total: number; met: number };
    ai: { total: number; met: number };
  };
  otherKPIs: {
    responseSpeed: { met: number; total: number };
    csat: { met: number; total: number };
  };
  growthMetrics: GrowthMetrics;
  overallScore: number;
}
