import React, { useState } from 'react';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import Chip from '../shared/Chip';
import { generateCoverLetter } from '../../services/geminiService';
import { UserProfile, ActiveView } from '../../types';
import { ClipboardCopy } from 'lucide-react';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';

interface CoverLetterGeneratorProps {
  profile: UserProfile;
  setActiveView: (view: ActiveView) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  isProcessingResume: boolean;
}

const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({ profile, setActiveView, updateProfile, isProcessingResume }) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [jobDescription, setJobDescription] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste the job description first.");
      return;
    }
    if (!profile.resumeText) {
        setError("Your resume data is missing. Please re-upload your resume.");
        return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await generateCoverLetter(profile.resumeText, jobDescription);
      setCoverLetter(result);
    } catch (err) {
      console.error("Error generating cover letter:", err);
      setError("Could not generate the cover letter. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  
  if (isProcessingResume) {
    return <Card title="AI Cover Letter Generator"><Spinner text="Analyzing your new resume, please wait a moment..." /></Card>;
  }

  return (
    <Card title="AI Cover Letter Generator">
      <p className="text-sm opacity-80 mb-4">
        Paste a job description below. The AI will use your uploaded resume to write a tailored cover letter.
      </p>

      {profile.resumeFile && (
        <p className="text-xs text-white/60 mb-3 text-center border border-dashed border-white/20 p-2 rounded-md">
          Using resume: <span className="font-medium">{profile.resumeFile.name}</span>.
          <button onClick={() => setActiveView('profile-settings')} className="underline ml-1 font-semibold">Change</button>
        </p>
      )}
      
      {!coverLetter ? (
        <div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={8}
            placeholder="Paste the full job description here..."
            className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
          />
          {isLoading ? <Spinner text="Generating your cover letter..." /> : (
            <button
              onClick={handleGenerate}
              disabled={!jobDescription.trim()}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Generate with AI
            </button>
          )}
          {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        </div>
      ) : (
        <div className="animate-fade-in">
            <div className="relative p-3 bg-white/5 rounded-lg border border-white/20 my-3 text-sm whitespace-pre-wrap max-h-80 overflow-y-auto">
                <p>{coverLetter}</p>
                <button onClick={handleCopy} className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/20 text-white/70">
                    <ClipboardCopy className="w-4 h-4"/>
                </button>
            </div>
             {copied && <p className="text-xs text-green-400 text-right">Copied!</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            <Chip onClick={() => { setCoverLetter(''); setJobDescription(''); }}>Generate another</Chip>
            <Chip onClick={() => setActiveView("interview-prep")}>Prepare for interview</Chip>
          </div>
        </div>
      )}
    </Card>
  );
};

export default CoverLetterGenerator;