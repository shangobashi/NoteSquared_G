export enum PlanTier {
  SOLO = 'SOLO',
  STUDIO = 'STUDIO'
}

export enum LessonStatus {
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  READY_REVIEW = 'READY_REVIEW',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  studio_name?: string;
  plan_tier: PlanTier;
}

export interface Student {
  id: string;
  full_name: string;
  instrument: string;
  parent_email?: string;
}

export interface LessonAIOutputs {
  student_recap: string;
  practice_plan: string;
  parent_email: string;
}

export interface Lesson {
  id: string;
  student_id: string;
  date: string; // ISO String
  duration_sec: number;
  status: LessonStatus;
  
  // Outputs
  outputs?: LessonAIOutputs;
  transcript_text?: string;
  
  // Mock audio url (blob url)
  audio_url?: string;
}

export type ScreenState = 
  | 'DASHBOARD' 
  | 'STUDENT_DETAIL' 
  | 'RECORDING' 
  | 'PROCESSING' 
  | 'REVIEW';
