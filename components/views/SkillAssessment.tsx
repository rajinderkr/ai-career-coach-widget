import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import { generatePlacementPlan, getRelevantSkills } from '../../services/geminiService';
import { UserProfile, ActiveView, SWOT } from '../../types';
import ProgressBar from '../shared/ProgressBar';
import { FileText, ShieldCheck, AlertTriangle, TrendingUp, Zap } from 'lucide-react';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';
import { CREDIT_COSTS } from '../../constants';
import InfoMessage from '../shared/InfoMessage';

interface SkillAssessmentProps {
  profile: UserProfile;
  setActiveView: (view: ActiveView) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isProcessingResume: boolean;
  handleGoToProfile: (returnView: ActiveView) => void;
}

const planGenerationSteps = [
    "Analyzing your skills...",
    "Generating SWOT analysis...",
    "Building your personalized action plan...",
];

const skillFetchingSteps = [
    "Analyzing your job title...",
    "Identifying key skills for the role...",
];

const swotMap = {
    strengths: { icon: ShieldCheck, color: 'text-green-600', title: 'Strengths' },
    weaknesses: { icon: AlertTriangle, color: 'text-amber-600', title: 'Weaknesses' },
    opportunities: { icon: TrendingUp, color: 'text-blue-600', title: 'Opportunities' },
    threats: { icon: Zap, color: 'text-red-600', title: 'Threats' }
};

const SwotSummary: React.FC<{ swot: SWOT }> = ({ swot }) => (
    <div className="grid grid-cols-2 gap-3 mt-2">
        {(Object.keys(swot) as Array<keyof SWOT>).map(key => {
            const { icon: Icon, color, title } = swotMap[key];
            return (
                <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                        <Icon className={`w-4 h-4 ${color}`} />
                        <h4 className={`font-semibold text-sm ${color}`}>{title}</h4>
                    </div>
                    <ul className="list-disc list-inside text-xs space-y-0.5 text-gray-600 pl-1">
                        {(swot[key] ?? []).slice(0, 2).map((point, i) => <li key={i} className="truncate">{point}</li>)}
                    </ul>
                </div>
            );
        })}
    </div>
);


const SkillAssessment: React.FC<SkillAssessmentProps> = ({ profile, setActiveView, updateProfile, isProcessingResume, handleGoToProfile }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingSkills, setIsFetchingSkills] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showPlan, setShowPlan] = useState(!!profile.placementPlan);

  useEffect(() => {
    const fetchSkills = async () => {
      if (!profile.jobTitle) return;
      try {
        setError(null);
        setIsFetchingSkills(true);
        setCurrentStep(0);
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setCurrentStep(1);
        const skillNames = await getRelevantSkills(profile.jobTitle);
        const initialSkills = skillNames.map(name => ({ name, rating: 5 }));
        updateProfile({ skills: initialSkills });

      } catch (err) {
        console.error("Error fetching skills:", err);
        setError("Could not fetch relevant skills for that job title. Please try again.");
      } finally {
        setIsFetchingSkills(false);
      }
    };

    if (profile.jobTitle && profile.skills.length === 0) {
      fetchSkills();
    }
  }, [profile.jobTitle, profile.skills.length, updateProfile]);

  useEffect(() => {
    let timer: number | undefined;
    if (isLoading) {
      setCurrentStep(0);
      const stepDuration = 1200;
      timer = window.setInterval(() => {
        setCurrentStep(prev => {
          if (prev < planGenerationSteps.length - 1) {
            return prev + 1;
          }
          clearInterval(timer);
          return prev;
        });
      }, stepDuration);
    }
    return () => clearInterval(timer);
  }, [isLoading]);

  const handleRatingChange = (index: number, rating: number) => {
    const newSkills = [...profile.skills];
    newSkills[index].rating = rating;
    updateProfile({ skills: newSkills });
  };

  const handleGeneratePlan = async () => {
    if (profile.credits < CREDIT_COSTS.skillAssessment) {
        setError(<InsufficientCreditsError cost={CREDIT_COSTS.skillAssessment} credits={profile.credits} />);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      if (!profile.jobTitle || profile.yearsOfExperience === null) {
          throw new Error("Missing profile information to generate plan.");
      }
      const plan = await generatePlacementPlan(profile.resumeText, profile.jobTitle, profile.yearsOfExperience, profile.skills);
      
      if (!plan || !plan.actionPlan || plan.actionPlan.length === 0) {
        throw new Error("The AI was unable to generate a valid action plan. Please try adjusting your job title or skills.");
      }

      const updatedCompletedSteps = [...new Set<ActiveView>([...profile.completedSteps, 'skill-assessment', 'placement-plan'])];
      
      updateProfile({ 
          credits: profile.credits - CREDIT_COSTS.skillAssessment,
          placementPlan: plan,
          completedSteps: updatedCompletedSteps,
      });
      
      setActiveView('placement-plan');

    } catch (err) {
      console.error("Error generating placement plan:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(`Could not generate your placement plan. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isProcessingResume) {
    return <Card title="Step 1: Skill Assessment"><Spinner text="Analyzing your new resume, please wait a moment..." /></Card>;
  }
  
  if (isFetchingSkills || (profile.jobTitle && profile.skills.length === 0 && !showPlan)) {
    return (
      <Card title="Step 1: Skill Assessment">
        <ProgressBar steps={skillFetchingSteps} currentStep={currentStep} />
      </Card>
    );
  }

  if (showPlan && profile.placementPlan) {
    return (
      <Card title="Your Placement Plan">
        <div className="animate-fade-in">
          <p className="text-sm text-gray-600 mb-3">You have an existing plan. You can view the full details, or retake the assessment to generate a new one.</p>
          <h4 className="font-semibold text-sm mb-2 text-gray-800">SWOT Analysis Summary</h4>
          <SwotSummary swot={profile.placementPlan.swot} />

          <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                  onClick={() => setActiveView('placement-plan')}
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  View Full Plan
              </button>
              <button
                  onClick={() => setShowPlan(false)}
                  className="w-full px-3 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
                >
                  Retake Assessment
              </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Step 1: Skill Assessment">
      <p className="text-sm text-gray-600 mb-4">Rate your skills (1-10) for your target role of <b>{profile.jobTitle}</b> to get a personalized roadmap.</p>
      {isLoading ? <ProgressBar steps={planGenerationSteps} currentStep={currentStep} /> : 
      (<>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-200">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Resume for Analysis</h3>
          {profile.resumeFile ? (
            <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="w-5 h-5 text-brand flex-shrink-0" />
                <span className="text-sm truncate text-gray-800">{profile.resumeFile.name}</span>
              </div>
              <button onClick={() => setActiveView('profile-settings')} className="text-xs font-medium text-brand hover:underline flex-shrink-0">Change</button>
            </div>
          ) : (
             <InfoMessage type="warning" onClick={() => handleGoToProfile('skill-assessment')}>
                No resume found. A plan will be generated based on your skills only. <span className="font-semibold underline">Upload a resume for a more detailed plan.</span>
            </InfoMessage>
          )}
        </div>

        <div className="space-y-3 max-h-52 overflow-y-auto pr-2 text-gray-800">
          {profile.skills.map((skill, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-sm flex-1">{skill.name}</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={skill.rating}
                  onChange={(e) => handleRatingChange(index, parseInt(e.target.value))}
                  className="w-24 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand"
                />
                <span className="text-sm font-semibold w-6 text-center">{skill.rating}</span>
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleGeneratePlan}
          className="mt-4 w-full px-3 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
        >
          Generate Placement Plan ({CREDIT_COSTS.skillAssessment} Credits)
        </button>
      </>
      )}
      {error && !isLoading && <div className="mt-2 text-center">{error}</div>}
    </Card>
  );
};

export default SkillAssessment;