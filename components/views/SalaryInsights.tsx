import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import { getSalaryInsights } from '../../services/geminiService';
import { UserProfile, SalaryInsightsData, ActiveView } from '../../types';
import Chip from '../shared/Chip';
import ProgressBar from '../shared/ProgressBar';
import { RefreshCw } from 'lucide-react';
import WorkshopCtaCard from '../shared/WorkshopCtaCard';
import { CREDIT_COSTS } from '../../constants';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';

interface SalaryInsightsProps {
  profile: UserProfile;
  setActiveView: (view: ActiveView) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isProcessingResume: boolean;
}

const salarySteps = [
    "Analyzing your job title and experience...",
    "Fetching real-time salary data...",
    "Compiling your personalized insights...",
];

const getCurrencyInfo = (location: string) => {
    const lowerLocation = location.toLowerCase();
    if (lowerLocation.includes('india') || lowerLocation.endsWith(' in')) return { currency: 'INR', symbol: '₹' };
    if (lowerLocation.includes('canada') || lowerLocation.endsWith(' ca')) return { currency: 'CAD', symbol: 'CA$' };
    if (lowerLocation.includes('united kingdom') || lowerLocation.endsWith(' uk') || lowerLocation.endsWith(' gb')) return { currency: 'GBP', symbol: '£' };
    return { currency: 'USD', symbol: '$' };
};

const formatCurrency = (value: string, symbol: string) => {
    const numericString = (value || '0').toString().replace(/[^0-9.-]+/g,"");
    const number = parseInt(numericString, 10);
    if (isNaN(number)) {
        return `${symbol}${value}`;
    }
    return `${symbol}${number.toLocaleString()}`;
};


const SalaryInsights: React.FC<SalaryInsightsProps> = ({ profile, setActiveView, updateProfile, isProcessingResume }) => {
  const [data, setData] = useState<SalaryInsightsData | null>(profile.salaryInsightsCache || null);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const hasProfileChanged = profile.jobTitle !== profile.salaryInsightsCache?.jobTitle || profile.yearsOfExperience !== profile.salaryInsightsCache?.yearsOfExperience;

  const fetchInsights = async (forceRefresh = false) => {
    if (profile.credits < CREDIT_COSTS.salaryInsights) {
        setError(<InsufficientCreditsError cost={CREDIT_COSTS.salaryInsights} credits={profile.credits} />);
        return;
    }
    
    if ((data && !forceRefresh && !hasProfileChanged) || isProcessingResume) {
      if(isProcessingResume) setIsLoading(true);
      return;
    }
    
    if (!profile.jobTitle || profile.yearsOfExperience === null) {
      setError("Please complete your profile to get salary insights.");
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
        const stepDuration = 1000;
        let fetchedLocation = profile.location;
        if (!fetchedLocation) {
          const res = await fetch('https://ipinfo.io?token=d369b6f31b30af');
          const ipData = await res.json();
          fetchedLocation = (ipData.city && ipData.country)
            ? `${ipData.city}, ${ipData.country}`
            : "New York, USA";
          updateProfile({ location: fetchedLocation });
        }
      
        setCurrentStep(0); // Analyzing...
        await new Promise(resolve => setTimeout(resolve, stepDuration));
        
        setCurrentStep(1); // Fetching...
        const insights = await getSalaryInsights(profile.jobTitle, fetchedLocation, profile.yearsOfExperience);
        
        setCurrentStep(2); // Compiling...
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const insightsWithMeta = { ...insights, jobTitle: profile.jobTitle, yearsOfExperience: profile.yearsOfExperience };
        setData(insightsWithMeta);
        updateProfile({
          salaryInsightsCache: insightsWithMeta,
          credits: profile.credits - CREDIT_COSTS.salaryInsights
        });
        
    } catch (err) {
      console.error("Error fetching salary insights:", err);
      const errorMessage = err instanceof Error ? err.message : "Please try again later.";
      setError(`Could not fetch salary insights. ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [profile.jobTitle, profile.location, profile.yearsOfExperience, isProcessingResume]);

  const currencySymbol = getCurrencyInfo(profile.location || '').symbol;

  return (
    <>
      <Card title={
          <div className="flex justify-between items-center">
            <span>Salary Insights</span>
            <button 
              onClick={() => fetchInsights(true)}
              disabled={isLoading}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Refresh salary insights"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }>
        {isLoading ? <ProgressBar steps={salarySteps} currentStep={currentStep} /> :
        error ? <div className="mt-2 text-red-600 text-sm">{error}</div> :
        data ? (
          <div className="animate-fade-in text-gray-800">
            <p className="text-sm text-gray-600 mb-3">
              For a <b>{profile.jobTitle}</b> with <b>{profile.yearsOfExperience} years</b> of experience in <b>{profile.location}</b>:
            </p>
            <div className="grid md:grid-cols-3 gap-3 text-center mb-4">
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Typical Low End</p><p className="font-bold text-lg">{formatCurrency(data.lowerRange, currencySymbol)}</p></div>
                <div className="bg-brand/10 p-3 rounded-lg border border-brand/30"><p className="text-xs text-brand/80">Average</p><p className="font-bold text-xl text-brand-dark">{formatCurrency(data.average, currencySymbol)}</p></div>
                <div className="bg-gray-50 p-3 rounded-lg"><p className="text-xs text-gray-500">Typical High End</p><p className="font-bold text-lg">{formatCurrency(data.upperRange, currencySymbol)}</p></div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold mb-2">Key Skills to Boost Salary</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {(data.keySkills ?? []).map(skill => <li key={skill}>{skill}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Top Industries Hiring</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  {(data.industries ?? []).map(industry => <li key={industry}>{industry}</li>)}
                </ul>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Chip onClick={() => setActiveView("profile-settings")}>Search for another role</Chip>
              <Chip onClick={() => setActiveView("jobs")}>Find Jobs Now</Chip>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center">No data available.</p>
        )}
      </Card>
      {data && !isLoading && <WorkshopCtaCard />}
    </>
  );
};

export default SalaryInsights;