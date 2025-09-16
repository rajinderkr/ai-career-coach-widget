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

export const FEATURE_FLAGS = {
  "enableChat": true,
  "showSuggestedPrompts": false,
  "assessment": {
    "title": "Assessment",
    "icon": "ListChecks",
    "enabled": true,
    "features": [
      {
        "label": "Skill Assessment & Plan",
        "view": "skill-assessment",
        "enabled": true
      }
    ]
  },
  "optimize": {
    "title": "Optimize",
    "icon": "FileText",
    "enabled": true,
    "features": [
      {
        "label": "Resume Score",
        "view": "resume-score",
        "enabled": true
      },
      {
        "label": "Resume Rewrite",
        "view": "resume-rewrite",
        "enabled": false
      },
      {
        "label": "Cover Letter Generator",
        "view": "cover-letter",
        "enabled": false
      }
    ]
  },
  "branding": {
    "title": "Branding",
    "icon": "Linkedin",
    "enabled": true,
    "features": [
      {
        "label": "Optimize Headline",
        "view": "linkedin-headline",
        "enabled": true
      },
      {
        "label": "Optimize About Section",
        "view": "linkedin-about",
        "enabled": true
      },
      {
        "label": "Networking Plan",
        "view": "referrals",
        "enabled": false
      }
    ]
  },
  "interview": {
    "title": "Interview",
    "icon": "MessageSquare",
    "enabled": true,
    "features": [
      {
        "label": "Job Aligned Interview Questions",
        "view": "interview-prep",
        "enabled": true
      }
    ]
  },
  "hiddenJobMarket": {
    "title": "Job Market",
    "icon": "Briefcase",
    "enabled": true,
    "features": [
      {
        "label": "Salary Insights",
        "view": "salary-insights",
        "enabled": true
      },
      {
        "label": "Find Jobs",
        "view": "jobs",
        "enabled": true
      },
      {
        "label": "Get Referrals",
        "view": "referrals",
        "enabled": false
      }
    ]
  }
};