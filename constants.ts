export const GEMINI_MODEL = 'gemini-2.5-flash';

export const DAILY_CREDIT_ALLOCATION = 30;

export const CREDIT_COSTS = {
  skillAssessment: 10,
  resumeScore: 10,
  interviewPrep: 10,
  linkedInHeadline: 3,
  linkedInAbout: 3,
  salaryInsights: 3,
  findJobs: 2,
  // FIX: Added missing credit cost for legacy linkedInTips feature.
  linkedInTips: 3,
};