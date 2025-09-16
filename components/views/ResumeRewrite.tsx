import React, { useState } from 'react';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import Chip from '../shared/Chip';
import { rewriteResumeSummary } from '../../services/geminiService';
import { UserProfile, ActiveView } from '../../types';
import { ClipboardCopy } from 'lucide-react';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';
import WorkshopCtaCard from '../shared/WorkshopCtaCard';

interface ResumeRewriteProps {
  profile: UserProfile;
  setActiveView: (view: ActiveView) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const ResumeRewrite: React.FC<ResumeRewriteProps> = ({ profile, setActiveView, updateProfile }) => {
  const [rewrittenSummary, setRewrittenSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRewrite = async () => {
    if (!summary.trim()) {
      setError("Please paste your summary first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await rewriteResumeSummary(summary, profile.jobTitle);
      setRewrittenSummary(result);
    } catch (err) {
      console.error("Error rewriting summary:", err);
      setError("Could not rewrite summary. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(rewrittenSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <Card title="AI Resume Rewrite">
        <p className="text-sm text-gray-600">Paste your current summary, and I’ll rewrite it for impact.</p>
        
        {!rewrittenSummary ? (
          <div className="mt-3">
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={5}
              placeholder="Paste your current resume summary here..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-brand"
            />
            {isLoading ? <Spinner text="Rewriting..." /> : (
              <button
                onClick={handleRewrite}
                className="mt-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
              >
                Rewrite with AI
              </button>
            )}
            {error && <div className="text-red-600 mt-2 text-sm">{error}</div>}
          </div>
        ) : (
          <div className="animate-fade-in mt-3">
              <div className="relative p-3 bg-gray-50 rounded-lg border border-gray-200 my-3 text-sm text-gray-800">
                  <p>{rewrittenSummary}</p>
                  <button onClick={handleCopy} className="absolute top-2 right-2 p-1 rounded-md hover:bg-gray-200 text-gray-500">
                      <ClipboardCopy className="w-4 h-4"/>
                  </button>
              </div>
              {copied && <p className="text-xs text-green-500 text-right">Copied!</p>}
            <div className="flex flex-wrap gap-2 mt-3">
              {/* FIX: Changed setActiveView argument from "linkedin-tips" to "linkedin-headline" as "linkedin-tips" is not a valid ActiveView. */}
              <Chip onClick={() => setActiveView("linkedin-headline")}>Optimize LinkedIn next</Chip>
            </div>
          </div>
        )}
      </Card>
      {rewrittenSummary && !isLoading && <WorkshopCtaCard />}
    </>
  );
};

export default ResumeRewrite;