import { Student, User, PlanTier } from "./types";

export const SYSTEM_PROMPT = `
Role: You are an expert music teacher assistant.
Task: Analyze the provided lesson audio/transcript.
Constraint: Output valid JSON only.

JSON Schema Enforced:
{
  "student_recap": "String. Tone: Encouraging but specific. Max 100 words.",
  "practice_plan": "String. Markdown bullet points. Broken down by days (Mon-Sun) or generic 'Day 1'. Specific assignments only.",
  "parent_email": "String. Professional summary. Max 150 words. Focus on progress."
}
`;

// Mock Data
export const MOCK_USER: User = {
  id: 'user-1',
  full_name: 'Alex Rivera',
  email: 'alex@musicstudio.com',
  plan_tier: PlanTier.SOLO,
  studio_name: "Rivera Music Studio"
};

export const MOCK_STUDENTS: Student[] = [
  { id: 'st-1', full_name: 'Sarah Chen', instrument: 'Piano', parent_email: 'mrs.chen@example.com' },
  { id: 'st-2', full_name: 'Leo Das', instrument: 'Violin', parent_email: 'mr.das@example.com' },
  { id: 'st-3', full_name: 'Maya Johnson', instrument: 'Guitar', parent_email: 'maya.mom@example.com' },
];
