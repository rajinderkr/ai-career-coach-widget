import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import { getLinkedInAbout } from '../../services/geminiService';
import { UserProfile, ActiveView } from '../../types';
import { ClipboardCopy, RefreshCw } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import WorkshopCtaCard from '../shared/WorkshopCtaCard';
import { CREDIT_COSTS } from '../../constants';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';
import InfoMessage from '../shared/InfoMessage';

interface LinkedInAboutProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setActiveView: (view: ActiveView) => void;
  handleGoToProfile: (returnView: ActiveView) => void;
}

const aboutGenerationSteps = [
    "Analyzing your profile and resume...",
    "Crafting your 'About' section..."
];

const LinkedInAbout: React.FC<LinkedInAboutProps> = ({ profile, updateProfile, setActiveView, handleGoToProfile }) => {
  const [about, setAbout] = useState<string | null>(profile.linkedInAboutCache?.about || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const hasProfileChangedForAbout = profile.jobTitle !== profile.linkedInAboutCache?.jobTitle || profile.resumeText !== profile.linkedInAboutCache?.resumeText;

  const fetchAbout = async (forceRefresh = false) => {
      if (about && !forceRefresh && !hasProfileChangedForAbout) return;
      
      if (!profile.resumeText) {
        // This view should not be accessible without a resume, but this is a safeguard.
        setError(
          <InfoMessage type="error" onClick={() => handleGoToProfile('linkedin-about')}>
            A resume is required to generate your "About" section. <span className="font-semibold underline">Click here to upload one.</span>
          </InfoMessage>
        );
        return;
      }
      
      if (profile.credits < CREDIT_COSTS.linkedInAbout) {
        setError(<InsufficientCreditsError cost={CREDIT_COSTS.linkedInAbout} credits={profile.credits} />);
        return;
      }

      setIsLoading(true);
      setError(null);
      setCopied(false);

      try {
        setCurrentStep(0);
        await new Promise(resolve => setTimeout(resolve, 1000));

        setCurrentStep(1);
        const result = await getLinkedInAbout(profile.jobTitle, profile.resumeText);
        
        const aboutWithMeta = { about: result, jobTitle: profile.jobTitle, resumeText: profile.resumeText };
        setAbout(result);
        updateProfile({ 
            linkedInAboutCache: aboutWithMeta,
            credits: profile.credits - CREDIT_COSTS.linkedInAbout,
        });

      } catch (err) {
        console.error("Error getting LinkedIn about section:", err);
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(`Could not generate LinkedIn "About" section. ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    // Only fetch if a resume is present.
    if (profile.resumeText) {
      fetchAbout();
    }
  }, [profile.jobTitle, profile.resumeText]);
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!profile.resumeText) {
    return (
        <Card title='Optimize "About" Section'>
            <InfoMessage type="error" onClick={() => handleGoToProfile('linkedin-about')}>
                Please upload your resume in "My Profile" first. The AI will use it to highlight your specific achievements.
            </InfoMessage>
        </Card>
    );
  }

  return (
    <>
      <Card title={
          <div className="flex justify-between items-center">
            <span>Optimize "About" Section</span>
            <button 
              onClick={() => fetchAbout(true)}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label='Refresh "About" Section'
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }>
        {isLoading && <ProgressBar steps={aboutGenerationSteps} currentStep={currentStep} />}
        {error && <div className="text-sm p-3">{error}</div>}
        
        {about && !isLoading && (
          <div className="space-y-6 animate-fade-in text-gray-800">
            <div>
              <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-sm">Your New "About" Section:</h4>
                  <button onClick={() => handleCopy(about)} className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark px-2 py-1 rounded-md hover:bg-gray-100">
                      <ClipboardCopy className="w-3.5 h-3.5"/> {copied ? 'Copied!' : 'Copy'}
                  </button>
              </div>
              <p className="text-sm p-3 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap max-h-60 overflow-y-auto">{about}</p>
            </div>
          </div>
        )}
      </Card>
      {about && !isLoading && <WorkshopCtaCard />}
    </>
  );
};

export default LinkedInAbout;