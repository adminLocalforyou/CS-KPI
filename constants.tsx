import { StaffMember, EvaluationRecord } from './types.ts';

export interface StaffMemberWithPass extends StaffMember {
  passcode: string;
}

export const TEAM_MEMBERS: StaffMemberWithPass[] = [
  { id: '1', name: 'Pookie', role: 'Support Specialist', passcode: '5512' },
  { id: '2', name: 'Pei Pei', role: 'Support Specialist', passcode: '4483' },
  { id: '3', name: 'Pume', role: 'Project Coordinator', passcode: '9528' },
  { id: '4', name: 'Namva', role: 'Support Specialist', passcode: '7598' },
  { id: '5', name: 'Aim', role: 'Project Specialist', passcode: '5589' },
  { id: '6', name: 'Noey', role: 'Senior Support', passcode: '1514' },
  { id: '7', name: 'Nick', role: 'Support Specialist (Shift Buddy: Namva)', passcode: '1122' },
  { id: '8', name: 'Support TBA 2', role: 'Support Staff', passcode: '0000' },
];

export const INITIAL_EVALUATIONS: EvaluationRecord[] = [];