
import React, { useState, useEffect } from 'react';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import { findJobs } from '../../services/geminiService';
import { UserProfile, Job } from '../../types';
import { Briefcase, ArrowUpRight } from 'lucide-react';

interface JobsProps {
  profile: UserProfile;
}

const Jobs: React.FC<JobsProps> = ({ profile }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      if (!profile.jobTitle || !profile.location) return;
      setIsLoading(true);
      setError(null);
      try {
        const results = await findJobs(profile.jobTitle, profile.location);
        setJobs(results);
      } catch (err) {
        console.error("Error finding jobs:", err);
        setError("Could not find jobs. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchJobs();
  }, [profile.jobTitle, profile.location]);

  return (
    <Card title={`Job Openings for ${profile.jobTitle} in ${profile.location || 'your area'}`}>
      {isLoading && <Spinner text="Searching for jobs..." />}
      {error && <p className="text-sm text-red-400">{error}</p>}
      {!isLoading && jobs.length === 0 && !error && (
        <p className="text-sm text-white/70">No recent job postings found. Try again later.</p>
      )}
      {jobs.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {jobs.map((job, index) => (
            <a 
              key={index} 
              href={job.uri} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 opacity-60 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{job.title}</p>
                  <p className="text-xs opacity-70">{job.company} • {job.location}</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 opacity-60" />
            </a>
          ))}
        </div>
      )}
    </Card>
  );
};

export default Jobs;