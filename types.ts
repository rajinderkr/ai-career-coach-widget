// FIX: Add 'chat' to ActiveView to allow switching to the chat interface.
export type ActiveView = 
  | 'welcome'
  | 'chat'
  | 'salary-insights'
  | 'resume-score'
  | 'resume-rewrite'
  | 'bullet-point-optimizer'
  | 'cover-letter'
  | 'linkedin-headline'
  | 'linkedin-about'
  | 'skill-assessment'
  | 'interview-prep'
  | 'referrals'
  | 'jobs'
  | 'placement-plan'
  | 'profile-settings';

export interface SWOT {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ActionItem {
  priority: 'High' | 'Medium' | 'Low';
  action: string;
  timeline: string;
  skillRating?: number;
  courseName?: string;
  courseUrl?: string;
}

export interface PlacementPlanData {
  swot: SWOT;
  actionPlan: ActionItem[];
}

// FIX: Added missing ProcessedResume interface.
export interface ProcessedResume {
  resumeText: string;
  location: string;
  yearsOfExperience: number;
}

export interface LinkedInHeadlineData {
    headline: string;
    score: number;
    scoreExplanation: string;
    // Cache-related metadata
    jobTitle?: string;
    resumeText?: string | null;
}

// FIX: Added missing LinkedInTipsData interface to support legacy LinkedInTips component.
export interface LinkedInTipsData extends LinkedInHeadlineData {
    about: string;
}

export interface UserProfile {
  name: string;
  jobTitle: string;
  resumeText: string | null;
  resumeFile: File | null;
  resumeFileName: string | null;
  location: string | null;
  yearsOfExperience: number | null;
  completedSteps: ActiveView[];
  placementPlan: PlacementPlanData | null;
  skills: Skill[];
  interviewPrepJobDescription?: string;
  interviewQuestions?: InterviewQuestionWithAnswer[] | null;
  credits: number;
  lastCreditReset: string | null;
  salaryInsightsCache?: SalaryInsightsData | null;
  linkedInHeadlineCache?: LinkedInHeadlineData | null;
  linkedInAboutCache?: { 
    about: string,
    jobTitle?: string;
    resumeText?: string | null;
  } | null;
  // FIX: Added missing linkedInTipsCache property to UserProfile to support legacy LinkedInTips component.
  linkedInTipsCache?: LinkedInTipsData | null;
  resumeScoreCache?: {
    data: ResumeScoreData;
    jobDescription: string;
    resumeFileName: string;
  } | null;
}

export interface ChatMessage {
  id: number;
  text: string;
  isBot: boolean;
  status?: 'thinking' | 'complete'; // Bot messages only
  videoUrl?: string;
  action?: {
    text: string;
    view: ActiveView;
  };
}

export interface Skill {
  name: string;
  rating: number;
}

export interface Job {
    title: string;
    company: string;
    location: string;
    uri: string;
}

export interface SalaryInsightsData {
    average: string;
    upperRange: string;
    lowerRange: string;
    keySkills: string[];
    industries: string[];
    // Cache-related metadata
    jobTitle?: string;
    yearsOfExperience?: number;
}

export interface BrainyScoutResponse {
    Id: number;
    Email: string;
    Resume: string;
    JobDescription: string;
    ResumeMatchedSoftSkills: string;
    ResumeMatchedHardSkills: string;
    JobDescriptionMatchedSoftSkills: string;
    JobDescriptionMatchedHardSkills: string;
    OverAllScore: number;
    SoftSkillScore: number;
    HardSkillScore: number;
    HasEmail: boolean;
    HasPhone: boolean;
    HasGit: boolean;
    HasLinkedIn: boolean;
    HasEducation: boolean;
    ATSSkillScore: number;
    InterviewQuestions: any[];
}

export interface ScoreBreakdown {
    metric: string;
    score: number;
    explanation: string;
    matchedKeywords?: string[];
    missingKeywords?: string[];
}

export interface ResumeScoreData {
    overallScore: number;
    // FIX: Corrected typo from Scoredown to ScoreBreakdown.
    breakdown: ScoreBreakdown[];
}

export interface BrainyScoutJob {
  Id: number;
  Title: string;
  ShortDescription: string;
  Description: string;
  SourceURL: string;
  PostedDate: string;
}

export interface InterviewQuestionWithAnswer {
    question: string;
    suggestedAnswer: string;
}

export interface FeatureConfig {
  label: string;
  view: ActiveView;
  enabled: boolean;
}

export interface CategoryConfig {
  title: string;
  icon: string;
  enabled: boolean;
  features: FeatureConfig[];
}

export interface FeatureFlags {
  enableChat?: boolean;
  showSuggestedPrompts?: boolean;
  [key: string]: CategoryConfig | boolean | undefined;
}