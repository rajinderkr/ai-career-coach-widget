import React, { useState } from 'react';
import Card from '../shared/Card';
import { scoreResumeWithAI } from '../../services/geminiService';
import { UserProfile, ResumeScoreData, ActiveView, ScoreBreakdown } from '../../types';
import Chip from '../shared/Chip';
import { FileText } from 'lucide-react';
import CircularProgress from '../shared/CircularProgress';
import ProgressBar from '../shared/ProgressBar';
import Spinner from '../shared/Spinner';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';
import WorkshopCtaCard from '../shared/WorkshopCtaCard';
import { CREDIT_COSTS } from '../../constants';
import InfoMessage from '../shared/InfoMessage';

interface ResumeScoreProps {
  profile: UserProfile;
  setActiveView: (view: ActiveView) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isProcessingResume: boolean;
  handleGoToProfile: (returnView: ActiveView) => void;
}

const analysisSteps = [
    "Reading resume content...",
    "Analyzing job description...",
    "Comparing skills and keywords...",
    "Calculating final ATS score...",
];

const getScoreColor = (val: number) => {
    if (val < 50) return 'text-red-500';
    if (val < 80) return 'text-amber-500';
    return 'text-green-500';
};

const KeywordPill: React.FC<{ keyword: string; type: 'matched' | 'missing' }> = ({ keyword, type }) => {
    const baseClasses = "text-xs font-medium px-2 py-0.5 rounded-full";
    const typeClasses = type === 'matched' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500';
    return <span className={`${baseClasses} ${typeClasses}`}>{keyword}</span>;
};


const ResumeScore: React.FC<ResumeScoreProps> = ({ profile, setActiveView, updateProfile, isProcessingResume, handleGoToProfile }) => {
  const isCacheValid = profile.resumeScoreCache && profile.resumeFile && profile.resumeScoreCache.resumeFileName === profile.resumeFile.name;

  const [scoreData, setScoreData] = useState<ResumeScoreData | null>(isCacheValid ? profile.resumeScoreCache.data : null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [jobDescription, setJobDescription] = useState(isCacheValid ? profile.resumeScoreCache.jobDescription : '');
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async () => {
    if (profile.credits < CREDIT_COSTS.resumeScore) {
        setError(<InsufficientCreditsError cost={CREDIT_COSTS.resumeScore} credits={profile.credits} />);
        return;
    }
    if (!profile.resumeText) {
      setError("Please ensure your resume is uploaded in your profile.");
      return;
    }
    if (!jobDescription.trim()) {
      setError("Please paste the job description.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setScoreData(null);

    try {
      const stepDuration = 1500;
      setCurrentStep(0); // "Reading resume content..."
      await new Promise(resolve => setTimeout(resolve, 500)); 
      
      setCurrentStep(1); // "Analyzing job description..."
      await new Promise(resolve => setTimeout(resolve, stepDuration));
      
      setCurrentStep(2); // "Comparing skills and keywords..."
      const result = await scoreResumeWithAI(profile.resumeText, jobDescription);
      
      setCurrentStep(3); // "Calculating final ATS score..."
      await new Promise(resolve => setTimeout(resolve, 500));

      setScoreData(result);
      if (profile.resumeFile) {
        updateProfile({
          credits: profile.credits - CREDIT_COSTS.resumeScore,
          resumeScoreCache: {
            data: result,
            jobDescription,
            resumeFileName: profile.resumeFile.name,
          },
        });
      }

// FIX: Corrected invalid `catch (err) => {` syntax to `catch (err) {`.
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to scan resume.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAgain = () => {
      setScoreData(null);
      setJobDescription('');
      setError(null);
      updateProfile({ resumeScoreCache: null });
  }
  
  const renderBreakdownItem = (item: ScoreBreakdown, index: number) => {
    const isKeywordAlignment = item.metric === 'Keyword Alignment';
    return (
       <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-800">{item.metric}</span>
                <span className={`text-sm font-bold ${getScoreColor(item.score)}`}>{item.score}/100</span>
            </div>
            <p className="text-xs text-gray-600">{item.explanation}</p>
            {isKeywordAlignment && (item.matchedKeywords || item.missingKeywords) && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                    {item.matchedKeywords && item.matchedKeywords.length > 0 && (
                        <div className="mb-2">
                            <p className="text-xs font-semibold text-green-600 mb-1">Keywords Found:</p>
                            <div className="flex flex-wrap gap-1.5">
                                {item.matchedKeywords.map(kw => <KeywordPill key={kw} keyword={kw} type="matched" />)}
                            </div>
                        </div>
                    )}
                     {item.missingKeywords && item.missingKeywords.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-red-600 mb-1">Keywords Missing:</p>
                             <div className="flex flex-wrap gap-1.5">
                                {item.missingKeywords.map(kw => <KeywordPill key={kw} keyword={kw} type="missing" />)}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
  };
  
  if (isProcessingResume) {
    return <Card title="Resume ATS Score"><Spinner text="Analyzing your new resume, please wait a moment..." /></Card>;
  }

  return (
    <>
      <Card title="Resume ATS Score">
        {isLoading ? <ProgressBar steps={analysisSteps} currentStep={currentStep} /> :
        scoreData ? (
          <div className="animate-fade-in flex flex-col items-center">
              <p className="text-lg font-bold text-gray-800">Overall Match Score</p>
              <div className="my-4">
                <CircularProgress value={scoreData.overallScore} />
              </div>
              <p className="text-sm text-center mb-4 text-gray-700">Your resume scores <b>{scoreData.overallScore}%</b> against the job description.</p>
              
              <div className="w-full mt-4">
                <h4 className="font-semibold text-sm mb-2 text-center text-gray-800">Score Breakdown</h4>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {(scoreData.breakdown ?? []).map(renderBreakdownItem)}
                </div>
              </div>

            <div className="flex flex-wrap gap-2 mt-6">
              <Chip onClick={handleSearchAgain}>Score Another Job</Chip>
              <Chip onClick={() => setActiveView("resume-rewrite")}>Rewrite with AI</Chip>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">Get an instant analysis of how well your resume matches a job description.</p>
            
            <div className="space-y-4 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                <div>
                    <h3 className="font-semibold text-gray-900">Step 1: Your Profile</h3>
                    <p className="text-xs text-gray-500 mb-2">This information is from your main profile.</p>
                    {profile.resumeFile ? (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <FileText className="w-5 h-5 text-brand flex-shrink-0" />
                                <span className="text-sm truncate text-gray-800">{profile.resumeFile.name}</span>
                            </div>
                            <button onClick={() => setActiveView('profile-settings')} className="text-xs font-medium text-brand hover:underline flex-shrink-0">Change</button>
                        </div>
                    ) : (
                        <InfoMessage type="error" onClick={() => handleGoToProfile('resume-score')}>
                            No resume found. <span className="font-semibold underline">Click here to upload one.</span>
                        </InfoMessage>
                    )}
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 mt-4">Step 2: Target Job</h3>
                    <p className="text-xs text-gray-500 mb-2">Paste the job description you are applying for.</p>
                    <textarea
                        id="job-description"
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        rows={6}
                        placeholder="Paste the full job description here..."
                        className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-brand"
                    />
                </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!profile.resumeFile || !jobDescription.trim()}
              className="w-full mt-4 px-3 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors"
            >
              Get Score ({CREDIT_COSTS.resumeScore} Credits)
            </button>
            
            {error && <div className="mt-2">{error}</div>}
          </>
        )}
      </Card>
      {scoreData && !isLoading && <WorkshopCtaCard />}
    </>
  );
};

export default ResumeScore;