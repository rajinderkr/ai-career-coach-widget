import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import { getLinkedInTips } from '../../services/geminiService';
import { UserProfile, ActiveView, LinkedInTipsData } from '../../types';
import { Info, ClipboardCopy, RefreshCw } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import CircularProgress from '../shared/CircularProgress';
import WorkshopCtaCard from '../shared/WorkshopCtaCard';
import { CREDIT_COSTS } from '../../constants';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';

interface LinkedInTipsProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setActiveView: (view: ActiveView) => void;
}

const tipsGenerationSteps = [
    "Analyzing your profile...",
    "Generating an impactful headline...",
    "Crafting your 'About' section...",
    "Calculating headline score..."
];

const LinkedInTips: React.FC<LinkedInTipsProps> = ({ profile, updateProfile, setActiveView }) => {
  const [tips, setTips] = useState<LinkedInTipsData | null>(profile.linkedInTipsCache || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [copied, setCopied] = useState<'headline' | 'about' | null>(null);

  const hasProfileChangedForTips = profile.jobTitle !== profile.linkedInTipsCache?.jobTitle || profile.resumeText !== profile.linkedInTipsCache?.resumeText;

  const fetchTips = async (forceRefresh = false) => {
      if (tips && !forceRefresh && !hasProfileChangedForTips) return;

      if (!profile.jobTitle) {
        setError("Please set your job title in 'My Profile' to get LinkedIn tips.");
        return;
      }
      
      // FIX: Added guard to prevent API call if resume text is missing.
      if (!profile.resumeText) {
        return;
      }

      if (profile.credits < CREDIT_COSTS.linkedInTips) {
        setError(<InsufficientCreditsError cost={CREDIT_COSTS.linkedInTips} credits={profile.credits} />);
        return;
      }

      setIsLoading(true);
      setError(null);
      setCopied(null);

      try {
        const stepDuration = 1000;
        setCurrentStep(0);
        await new Promise(resolve => setTimeout(resolve, stepDuration));

        setCurrentStep(1);
        await new Promise(resolve => setTimeout(resolve, stepDuration));

        setCurrentStep(2);
        const result = await getLinkedInTips(profile.jobTitle, profile.resumeText);
        
        setCurrentStep(3);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const tipsWithMeta = { ...result, jobTitle: profile.jobTitle, resumeText: profile.resumeText };
        setTips(tipsWithMeta);
        updateProfile({ 
            linkedInTipsCache: tipsWithMeta,
            credits: profile.credits - CREDIT_COSTS.linkedInTips,
        });

      } catch (err) {
        console.error("Error getting LinkedIn tips:", err);
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(`Could not generate LinkedIn tips. ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchTips();
  }, [profile.jobTitle, profile.resumeText]);
  
  const handleCopy = (text: string, type: 'headline' | 'about') => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <>
      <Card title={
          <div className="flex justify-between items-center">
            <span>LinkedIn Optimization</span>
            <button 
              onClick={() => fetchTips(true)}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh LinkedIn tips"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }>
        {isLoading && <ProgressBar steps={tipsGenerationSteps} currentStep={currentStep} />}
        {error && <div className="text-sm p-3">{error}</div>}
        
        {!isLoading && !error && !profile.resumeText && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-amber-800 text-sm flex items-start gap-3">
              <Info className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <p>For even better results, upload your resume in "My Profile". The AI will use it to highlight your specific achievements.</p>
            </div>
        )}

        {tips && !isLoading && (
          <div className="space-y-6 animate-fade-in text-gray-800">
            <div>
              <h4 className="font-semibold text-sm mb-2">Suggested Headline Analysis</h4>
              <div className="flex flex-col md:flex-row items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0">
                      <CircularProgress value={tips.score} size={80} strokeWidth={8}/>
                  </div>
                  <div>
                      <p className="text-sm font-semibold">{tips.score}/100 - Strong Headline</p>
                      <p className="text-xs text-gray-600">{tips.scoreExplanation}</p>
                  </div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-sm">Your New Headline:</h4>
                  <button onClick={() => handleCopy(tips.headline, 'headline')} className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark px-2 py-1 rounded-md hover:bg-gray-100">
                      <ClipboardCopy className="w-3.5 h-3.5"/> {copied === 'headline' ? 'Copied!' : 'Copy'}
                  </button>
              </div>
              <p className="text-sm p-3 bg-gray-50 rounded-md border border-gray-200">{tips.headline}</p>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                  <h4 className="font-semibold text-sm">Your New "About" Section:</h4>
                  <button onClick={() => handleCopy(tips.about, 'about')} className="flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark px-2 py-1 rounded-md hover:bg-gray-100">
                      <ClipboardCopy className="w-3.5 h-3.5"/> {copied === 'about' ? 'Copied!' : 'Copy'}
                  </button>
              </div>
              <p className="text-sm p-3 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap max-h-48 overflow-y-auto">{tips.about}</p>
            </div>
          </div>
        )}
      </Card>
      {tips && !isLoading && <WorkshopCtaCard />}
    </>
  );
};

export default LinkedInTips;