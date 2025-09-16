import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import { getLinkedInHeadline } from '../../services/geminiService';
import { UserProfile, ActiveView, LinkedInHeadlineData } from '../../types';
import { ClipboardCopy, RefreshCw } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import CircularProgress from '../shared/CircularProgress';
import WorkshopCtaCard from '../shared/WorkshopCtaCard';
import { CREDIT_COSTS } from '../../constants';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';
import InfoMessage from '../shared/InfoMessage';

interface LinkedInHeadlineProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setActiveView: (view: ActiveView) => void;
  handleGoToProfile: (returnView: ActiveView) => void;
}

const headlineGenerationSteps = [
    "Analyzing your profile and resume...",
    "Generating an impactful headline...",
    "Calculating headline score..."
];

const LinkedInHeadline: React.FC<LinkedInHeadlineProps> = ({ profile, updateProfile, setActiveView, handleGoToProfile }) => {
  const [headlineData, setHeadlineData] = useState<LinkedInHeadlineData | null>(profile.linkedInHeadlineCache || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState(false);

  const hasProfileChangedForHeadline = profile.jobTitle !== profile.linkedInHeadlineCache?.jobTitle || profile.resumeText !== profile.linkedInHeadlineCache?.resumeText;

  const fetchHeadline = async (forceRefresh = false) => {
      if (headlineData && !forceRefresh && !hasProfileChangedForHeadline) return;

      if (!profile.resumeText) {
        // This view should not be accessible without a resume, but this is a safeguard.
        setError(
          <InfoMessage type="error" onClick={() => handleGoToProfile('linkedin-headline')}>
            A resume is required to generate a headline. <span className="font-semibold underline">Click here to upload one.</span>
          </InfoMessage>
        );
        return;
      }
      
      if (profile.credits < CREDIT_COSTS.linkedInHeadline) {
        setError(<InsufficientCreditsError cost={CREDIT_COSTS.linkedInHeadline} credits={profile.credits} />);
        return;
      }

      setIsLoading(true);
      setError(null);
      setCopied(false);

      try {
        setCurrentStep(0);
        await new Promise(resolve => setTimeout(resolve, 1000));

        setCurrentStep(1);
        const result = await getLinkedInHeadline(profile.jobTitle, profile.resumeText);
        
        setCurrentStep(2);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const headlineWithMeta = { ...result, jobTitle: profile.jobTitle, resumeText: profile.resumeText };
        setHeadlineData(headlineWithMeta);
        updateProfile({ 
            linkedInHeadlineCache: headlineWithMeta,
            credits: profile.credits - CREDIT_COSTS.linkedInHeadline,
        });

      } catch (err) {
        console.error("Error getting LinkedIn headline:", err);
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(`Could not generate LinkedIn headline. ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    // Only fetch if a resume is present.
    if (profile.resumeText) {
      fetchHeadline();
    }
  }, [profile.jobTitle, profile.resumeText]);
  
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(null), 2000);
  };
  
  if (!profile.resumeText) {
    return (
        <Card title="Optimize Headline">
            <InfoMessage type="error" onClick={() => handleGoToProfile('linkedin-headline')}>
                Please upload your resume in "My Profile" first. The AI will use it to highlight your specific achievements.
            </InfoMessage>
        </Card>
    );
  }


  return (
    <>
      <Card title={
          <div className="flex justify-between items-center">
            <span>Optimize Headline</span>
            <button 
              onClick={() => fetchHeadline(true)}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh LinkedIn headline"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }>
        {isLoading && <ProgressBar steps={headlineGenerationSteps} currentStep={currentStep} />}
        {error && <div className="text-sm p-3">{error}</div>}
        
        {headlineData && !isLoading && (
          <div className="space-y-6 animate-fade-in text-gray-800">
            <div>
              <h4 className="font-semibold text-sm mb-2">Suggested Headline Analysis</h4>
              <div className="flex flex-col md:flex-row items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0">
                      <CircularProgress value={headlineData.score} size={80} strokeWidth={8}/>
                  </div>
                  <div>
                      <p className="text-sm font-semibold">{headlineData.score}/100 - Strong Headline</p>
                      <p className="text-xs text-gray-600">{headlineData.scoreExplanation}</p>
                  </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-sm">Your New Headline:</h4>
                  <button onClick={() => handleCopy(headlineData.headline)} className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark px-2 py-1 rounded-md hover:bg-gray-100">
                      <ClipboardCopy className="w-3.5 h-3.5"/> {copied ? 'Copied!' : 'Copy'}
                  </button>
              </div>
              <p className="text-sm p-3 bg-gray-50 rounded-md border border-gray-200">{headlineData.headline}</p>
            </div>
          </div>
        )}
      </Card>
      {headlineData && !isLoading && <WorkshopCtaCard />}
    </>
  );
};

export default LinkedInHeadline;