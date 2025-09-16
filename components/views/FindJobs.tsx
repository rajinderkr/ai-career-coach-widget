import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import { findJobs } from '../../services/geminiService';
import { UserProfile, Job, ActiveView } from '../../types';
import { Briefcase, ArrowUpRight, RefreshCw } from 'lucide-react';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';
import { CREDIT_COSTS } from '../../constants';

interface FindJobsProps {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  setActiveView: (view: ActiveView) => void;
}

const FindJobs: React.FC<FindJobsProps> = ({ profile, updateProfile, setActiveView }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);

  // Local state for the form if profile data is missing
  const [jobTitle, setJobTitle] = useState(profile.jobTitle || '');
  const [location, setLocation] = useState(profile.location || '');

  const hasRequiredInfo = profile.jobTitle && profile.location;

  const fetchJobs = async (title: string, loc: string, fetchLatest = false) => {
    // Check for credits *before* checking if a refresh is happening
    if (profile.credits < CREDIT_COSTS.findJobs) {
        setError(<InsufficientCreditsError cost={CREDIT_COSTS.findJobs} credits={profile.credits} />);
        return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const results = await findJobs(title, loc, fetchLatest);
      setJobs(results);
      // Only deduct credits on the initial load or a manual refresh.
      if (jobs.length === 0 || fetchLatest) {
        updateProfile({ credits: profile.credits - CREDIT_COSTS.findJobs });
      }
    } catch (err) {
      console.error("Error finding jobs:", err);
      setError("Could not find jobs. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch jobs automatically if we have the info
  useEffect(() => {
    // Only run if info is present and jobs haven't been fetched yet
    if (hasRequiredInfo && jobs.length === 0) {
      fetchJobs(profile.jobTitle, profile.location!, false);
    }
  }, [profile.jobTitle, profile.location, hasRequiredInfo, jobs.length]);

  // Handle form submission for on-demand data collection
  const handleFormSubmit = async () => {
    if (!jobTitle) return;
    
    let fetchedLocation = location;
    if (!fetchedLocation) {
        // Get location via IP if not provided
        try {
            const res = await fetch('https://ipinfo.io?token=d369b6f31b30af');
            const ipData = await res.json();
            fetchedLocation = ipData.city && ipData.country ? `${ipData.city}, ${ipData.country}` : "New York, USA";
            setLocation(fetchedLocation);
        } catch (e) {
            console.error("IP info fetch failed", e);
            fetchedLocation = "New York, USA"; // Fallback
            setLocation(fetchedLocation);
        }
    }
    
    // Update profile, which will trigger the useEffect to fetch jobs
    updateProfile({ jobTitle, location: fetchedLocation });
  };
  
  const handleRefresh = () => {
      if (profile.jobTitle && profile.location) {
          fetchJobs(profile.jobTitle, profile.location, true);
      }
  };

  if (!hasRequiredInfo) {
    return (
        <Card title="Find Jobs">
            <p className="text-sm text-gray-600 mb-4">Tell us what you're looking for to find relevant job openings.</p>
            <div className="space-y-4">
                <div>
                    <label htmlFor="find-jobs-title" className="block text-sm font-medium mb-2 text-gray-800">Desired Job Title</label>
                    <input
                      id="find-jobs-title"
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g., Business Analyst"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-brand focus:border-brand"
                    />
                </div>
                <div>
                    <label htmlFor="find-jobs-location" className="block text-sm font-medium mb-2 text-gray-800">Location (Optional)</label>
                    <input
                      id="find-jobs-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Defaults to your current location"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-brand focus:border-brand"
                    />
                </div>
                <button
                  onClick={handleFormSubmit}
                  disabled={!jobTitle}
                  className="w-full px-3 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold disabled:opacity-50"
                >
                  Find Jobs ({CREDIT_COSTS.findJobs} Credits)
                </button>
            </div>
            {error && <div className="mt-2 text-red-600 text-sm">{error}</div>}
        </Card>
    );
  }

  return (
    <Card title={
        <div className="flex justify-between items-center">
          <span>{`Job Openings for ${profile.jobTitle} in ${profile.location || 'your area'}`}</span>
          <button 
            onClick={handleRefresh} 
            disabled={isLoading}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh job list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      }>
      {isLoading && <Spinner text="Searching for jobs..." />}
      {error && <div className="text-sm">{error}</div>}
      {!isLoading && jobs.length === 0 && !error && (
        <p className="text-sm text-gray-600">No recent job postings found. Try again later.</p>
      )}
      {jobs.length > 0 && (
        <div className="space-y-2 animate-fade-in max-h-96 overflow-y-auto pr-2">
          {jobs.map((job, index) => (
            <a 
              key={index} 
              href={job.uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden text-gray-800">
                <Briefcase className="w-5 h-5 opacity-60 flex-shrink-0" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{job.title}</p>
                  <p className="text-xs text-gray-600 truncate">{job.company} • {job.location}</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-60 flex-shrink-0" />
            </a>
          ))}
        </div>
      )}
    </Card>
  );
};

export default FindJobs;