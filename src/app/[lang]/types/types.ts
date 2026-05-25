// types.ts - Типы данных 

export interface RupFormData {
  subject: string;
  grade: string;
  goals: string;
  learningOutcomes: string;
  hours: string;
  language?: 'russian' | 'kazakh' | 'english';
  template?: 'standard' | 'university' | 'college' | 'simple';
  code?: string;
  cycle?: string;
  program?: string;
  semester?: string;
  credits?: string;
  prerequisites?: string;
  postrequisites?: string;
  teacher?: string;
  // Темы занятий 
  lectureTopics?: string[];
  labTopics?: string[];
  practicalTopics?: string[];
  sropTopics?: string[];
}

export interface CalendarFormData {
  subject: string;
  grade: string;
  hours: string;
  weeks: string;
  teacher: string;
  goals?: string;
  learningOutcomes?: string;
  language?: 'russian' | 'kazakh' | 'english';
  code?: string;
  credits?: string;
  semester?: string;
  group?: string;
  academicYear?: string;
  controlType?: string;
}

export interface RupData extends RupFormData {
  teacherInfo?: string;
  prerequisites?: string;
  goalsAndObjectives?: string;
  tasks?: string;
  learningRequirements?: string;
  postrequisites?: string;
  thematicPlanning?: string;
  calendarPlan?: string;
  practicalTasks?: string;
  sroTasks?: string;
  sroPlan?: string;
  evaluationCriteria?: string;
  schedule?: string;
  literature?: string;
  date?: string;
  year?: number;
  meta?: {
    generatedAt: string;
    template?: string;
    language?: string;
    note?: string;
  };
}

export interface CalendarData {
  subject: string;
  grade: string;
  hours: string;
  weeks: string;
  teacher: string;
  code?: string;
  credits?: string;
  semester?: string;
  group?: string;
  academicYear?: string;
  controlType?: string;
  generalInfo?: string;
  hoursDistribution?: string;
  calendarPlan?: string;
  controlSchedule?: string;
  literature?: string;
  guidelines?: string;
  meta?: {
    generatedAt: string;
    language?: string;
  };
}

export interface PromptFormData {
  prompt: string;
  type: 'rup' | 'calendar';
}