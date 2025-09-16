import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import { getInterviewQuestionsWithAnswers } from '../../services/geminiService';
import { UserProfile, InterviewQuestionWithAnswer, ActiveView } from '../../types';
import { FileText, ClipboardCopy, ChevronDown } from 'lucide-react';
import ProgressBar from '../shared/ProgressBar';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';
import WorkshopCtaCard from '../shared/WorkshopCtaCard';
import { CREDIT_COSTS } from '../../constants';
import InfoMessage from '../shared/InfoMessage';

interface InterviewPrepProps {
    profile: UserProfile;
    setActiveView: (view: ActiveView) => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    isProcessingResume: boolean;
    handleGoToProfile: (returnView: ActiveView) => void;
}

const qnaGenerationSteps = [
    "Analyzing your profile...",
    "Reviewing job description...",
    "Generating important questions...",
];

const InterviewPrep: React.FC<InterviewPrepProps> = ({ profile, setActiveView, updateProfile, isProcessingResume, handleGoToProfile }) => {
  const [questions, setQuestions] = useState<InterviewQuestionWithAnswer[]>(profile.interviewQuestions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const jobDescription = profile.interviewPrepJobDescription || '';
  const setJobDescription = (text: string) => updateProfile({ interviewPrepJobDescription: text });
  
  const [openQuestionIndex, setOpenQuestionIndex] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    let timer: number | undefined;
    if (isLoading) {
      setCurrentStep(0);
      const stepDuration = 1200; // Adjust as needed
      timer = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev < qnaGenerationSteps.length - 1) {
            return prev + 1;
          }
          clearInterval(timer);
          return prev;
        });
      }, stepDuration);
    }
    return () => clearInterval(timer);
  }, [isLoading]);


  const handleGenerateQuestions = async () => {
    if (profile.credits < CREDIT_COSTS.interviewPrep) {
        setError(<InsufficientCreditsError cost={CREDIT_COSTS.interviewPrep} credits={profile.credits} />);
        return;
    }
    if (!jobDescription.trim() || !profile.resumeText) {
        setError("Please provide a job description and ensure your resume is uploaded.");
        return;
    }

    setIsLoading(true);
    setError(null);
    setOpenQuestionIndex(0);
    try {
      const qs = await getInterviewQuestionsWithAnswers(profile.resumeText, jobDescription);
      setQuestions(qs);
      updateProfile({ 
          interviewQuestions: qs,
          credits: profile.credits - CREDIT_COSTS.interviewPrep,
      });
    } catch (err) {
      setError("Could not fetch interview questions. The AI may be busy, please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };
  
  const handleToggleQuestion = (index: number) => {
    setOpenQuestionIndex(openQuestionIndex === index ? null : index);
  }
  
  const handleGenerateAnother = () => {
    setQuestions([]);
    updateProfile({ interviewQuestions: null, interviewPrepJobDescription: '' });
    setError(null);
  };
  
  if (isProcessingResume) {
      return <Card title="Job Aligned Interview Questions"><Spinner text="Analyzing your new resume, please wait a moment..." /></Card>;
  }

  // Initial View: Ask for Job Description
  if (questions.length === 0) {
      return (
          <Card title="Job Aligned Interview Questions">
              <p className="text-sm text-gray-600 mb-4">
                  Generate the top 5 interview questions and answers, tailored to your resume and the target role.
              </p>
              
               {isLoading ? <ProgressBar steps={qnaGenerationSteps} currentStep={currentStep} /> : (
                <>
                  <div className="space-y-4 p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                      <div>
                          <h3 className="font-semibold text-gray-900">Step 1: Your Profile</h3>
                          <p className="text-xs text-gray-500 mb-2">Using your uploaded resume to tailor questions.</p>
                          {profile.resumeFile ? (
                              <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                      <FileText className="w-5 h-5 text-brand flex-shrink-0" />
                                      <span className="text-sm truncate text-gray-800">{profile.resumeFile.name}</span>
                                  </div>
                                  <button onClick={() => setActiveView('profile-settings')} className="text-xs font-medium text-brand hover:underline flex-shrink-0">Change</button>
                              </div>
                          ) : (
                            <InfoMessage type="error" onClick={() => handleGoToProfile('interview-prep')}>
                                Please upload your resume in "My Profile" first.
                            </InfoMessage>
                          )}
                      </div>

                      <div>
                          <h3 className="font-semibold text-gray-900 mt-4">Step 2: Target Job</h3>
                          <p className="text-xs text-gray-500 mb-2">Paste the job description to generate specific questions.</p>
                          <textarea
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                              rows={8}
                              placeholder="Paste the full job description here..."
                              className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-brand"
                          />
                      </div>
                  </div>
                  <button
                      onClick={handleGenerateQuestions}
                      disabled={!jobDescription.trim() || !profile.resumeText}
                      className="mt-4 w-full px-3 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      Generate Q&A ({CREDIT_COSTS.interviewPrep} Credits)
                  </button>
              </>
              )}
              {error && <div className="mt-2">{error}</div>}
          </Card>
      );
  }

  // Display Generated Q&A
  return (
    <>
      <Card title="Top 5 Interview Questions & Answers">
          <p className="text-sm text-gray-600 mb-4">Here are 5 questions tailored for you, with suggested answers based on your resume.</p>
          <div className="space-y-3">
              {questions.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <button
                          onClick={() => handleToggleQuestion(index)}
                          className="w-full p-4 text-left flex justify-between items-center hover:bg-gray-100"
                      >
                          <span className="font-semibold text-sm text-gray-800 flex-1 pr-2">{item.question}</span>
                          <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${openQuestionIndex === index ? 'rotate-180' : ''}`} />
                      </button>
                      {openQuestionIndex === index && (
                          <div className="p-4 border-t border-gray-200 animate-fade-in-down">
                              <div className="relative">
                                  <p className="text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">{item.suggestedAnswer}</p>
                                  <button onClick={() => handleCopy(item.suggestedAnswer, index)} className="absolute top-0 right-0 p-1 rounded-md hover:bg-gray-200 text-gray-500">
                                      <ClipboardCopy className="w-4 h-4"/>
                                  </button>
                                  {copiedIndex === index && <p className="text-xs text-green-600 text-right mt-1 absolute bottom-0 right-0">Copied!</p>}
                              </div>
                          </div>
                      )}
                  </div>
              ))}
          </div>
          <button 
              onClick={handleGenerateAnother}
              className="mt-6 w-full px-3 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
          >
              Generate for Another Job
          </button>
      </Card>
      <WorkshopCtaCard />
    </>
  );
};

export default InterviewPrep;