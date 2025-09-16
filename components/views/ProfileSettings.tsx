import React, { useState } from 'react';
import Card from '../shared/Card';
import ResumeDropzone from '../shared/ResumeDropzone';
import { UserProfile, ActiveView } from '../../types';
import ProgressBar from '../shared/ProgressBar';
import { processResumeFile } from '../../services/geminiService';

interface ProfileSettingsProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setActiveView: (view: ActiveView) => void;
  pendingChatQuestion?: string | null;
  postOnboardingView: ActiveView | null;
  setPostOnboardingView: (view: ActiveView | null) => void;
  setIsProcessingResumeInBackground: (isProcessing: boolean) => void;
}

const resumeProcessingSteps = [
  "Reading your resume file...",
  "Analyzing skills and experience...",
  "Finalizing profile setup...",
];

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, updateProfile, setActiveView, pendingChatQuestion, postOnboardingView, setPostOnboardingView, setIsProcessingResumeInBackground }) => {
  const [jobTitle, setJobTitle] = useState(profile.jobTitle || '');
  const [yearsOfExperience, setYearsOfExperience] = useState(profile.yearsOfExperience ?? '');
  const [newResumeFile, setNewResumeFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [processingStep, setProcessingStep] = useState(0);

  const handleSaveChanges = async () => {
    setIsProcessing(true);
    if (newResumeFile) {
        setIsProcessingResumeInBackground(true);
    }
    setError(null);
    setSuccessMessage(null);
    try {
      const jobTitleChanged = jobTitle !== profile.jobTitle;
      const yearsChanged = yearsOfExperience !== '' && Number(yearsOfExperience) !== profile.yearsOfExperience;
      const resumeChanged = !!newResumeFile;
      
      let profileUpdates: Partial<UserProfile> = {
        jobTitle,
        yearsOfExperience: Number(yearsOfExperience),
      };

      if (newResumeFile) {
        const { resumeText, location, yearsOfExperience: expFromResume } = await processResumeFile(newResumeFile, setProcessingStep);
        
        setProcessingStep(2); // Finalizing
        await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX

        profileUpdates.resumeFile = newResumeFile;
        profileUpdates.resumeFileName = newResumeFile.name;
        profileUpdates.resumeText = resumeText;
        if (location !== 'NOT_FOUND') {
            profileUpdates.location = location;
        }
        if (yearsOfExperience === '') {
            profileUpdates.yearsOfExperience = expFromResume;
            setYearsOfExperience(expFromResume);
        }
      }

      // Invalidate caches based on what changed
      if (jobTitleChanged || yearsChanged) {
        profileUpdates.salaryInsightsCache = null;
        profileUpdates.placementPlan = null;
      }
      if (jobTitleChanged) {
        profileUpdates.skills = []; // This will trigger a refetch in SkillAssessment
        // FIX: Replaced obsolete linkedInTipsCache with the new cache properties.
        profileUpdates.linkedInHeadlineCache = null;
        profileUpdates.linkedInAboutCache = null;
      }
      if (resumeChanged) {
        // FIX: Replaced obsolete linkedInTipsCache with the new cache properties.
        profileUpdates.linkedInHeadlineCache = null;
        profileUpdates.linkedInAboutCache = null;
        profileUpdates.placementPlan = null;
        profileUpdates.resumeScoreCache = null;
      }
      
      updateProfile(profileUpdates);
      setNewResumeFile(null);

      if (postOnboardingView) {
        setSuccessMessage("Profile created! Taking you to your feature...");
        setTimeout(() => {
          setActiveView(postOnboardingView);
          setPostOnboardingView(null);
        }, 1500);
      } else if (pendingChatQuestion) {
        setSuccessMessage("Your profile has been updated successfully!");
        setTimeout(() => {
          setSuccessMessage(null);
          setActiveView('chat');
        }, 1500);
      } else {
        setSuccessMessage("Your profile has been updated successfully!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (e) {
      console.error("Error updating profile:", e);
      setError(e instanceof Error ? e.message : "Could not save profile changes. Please try again.");
    } finally {
      setIsProcessing(false);
      if (newResumeFile) {
        setIsProcessingResumeInBackground(false);
      }
    }
  };
  
  const isSaveDisabled = isProcessing || !jobTitle || yearsOfExperience === '';
  
  const description = postOnboardingView
    ? "To give you personalized guidance, please tell us your target role and experience."
    : "Update your target job title, experience, and resume here at any time.";

  if (isProcessing && newResumeFile) {
      return (
          <Card title="My Profile Settings">
              <ProgressBar steps={resumeProcessingSteps} currentStep={processingStep} />
          </Card>
      );
  }

  return (
    <Card title="My Profile Settings">
      <p className="text-sm text-gray-600 mb-6">{description}</p>
      <div className="space-y-4">
        <div>
          <label htmlFor="profile-job-title" className="block text-sm font-medium mb-2 text-gray-800">Target Job Title</label>
          <input
            id="profile-job-title"
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g., Business Analyst"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div>
          <label htmlFor="profile-experience" className="block text-sm font-medium mb-2 text-gray-800">Years of Experience</label>
          <input
            id="profile-experience"
            type="number"
            value={yearsOfExperience}
            onChange={(e) => setYearsOfExperience(e.target.value === '' ? '' : Number(e.target.value))}
            min="0"
            placeholder="e.g., 5"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
          />
        </div>
        <div className="border-t border-gray-200 pt-4">
          <label className="block text-sm font-medium mb-2 text-gray-800">
            Upload Your Resume (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">Uploading a resume will improve the quality of AI features like Resume Score and Interview Prep.</p>
          <ResumeDropzone 
            onFileDrop={setNewResumeFile} 
            fileNameToDisplay={newResumeFile?.name || profile.resumeFileName} 
          />
        </div>
      </div>
      
      <button
          onClick={handleSaveChanges}
          disabled={isSaveDisabled}
          className="mt-6 w-full px-3 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Saving...' : 'Save Changes'}
      </button>

      {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
      {successMessage && <p className="text-sm text-green-600 mt-2 text-center">{successMessage}</p>}
    </Card>
  );
};

export default ProfileSettings;