import React, { useState } from 'react';
import Card from '../shared/Card';
import Spinner from '../shared/Spinner';
import Chip from '../shared/Chip';
import { optimizeBulletPoint } from '../../services/geminiService';
import { UserProfile, ActiveView } from '../../types';
import { ClipboardCopy, Lightbulb } from 'lucide-react';
import InsufficientCreditsError from '../shared/InsufficientCreditsError';

interface BulletPointOptimizerProps {
  profile: UserProfile;
  setActiveView: (view: ActiveView) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const BulletPointOptimizer: React.FC<BulletPointOptimizerProps> = ({ profile, setActiveView, updateProfile }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<React.ReactNode | null>(null);
  const [bulletPoint, setBulletPoint] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleOptimize = async () => {
    if (!bulletPoint.trim() || !jobDescription.trim()) {
      setError("Please fill in both your bullet point and the job description.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await optimizeBulletPoint(bulletPoint, jobDescription);
      setSuggestions(result);
    } catch (err) {
      console.error("Error optimizing bullet point:", err);
      setError("Could not optimize your bullet point. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <Card title="AI Bullet Point Optimizer">
      <p className="text-sm opacity-80 mb-4">
        Enter one of your resume bullet points and the target job description to get AI-powered suggestions.
      </p>
      
      {!suggestions.length ? (
        <div className="space-y-4">
          <div>
            <label htmlFor="bullet-point" className="block text-sm font-medium mb-1 text-white/90">Your Bullet Point</label>
            <textarea
              id="bullet-point"
              value={bulletPoint}
              onChange={(e) => setBulletPoint(e.target.value)}
              rows={3}
              placeholder="e.g., Managed project timelines and deliverables."
              className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="job-description-context" className="block text-sm font-medium mb-1 text-white/90">Target Job Description</label>
            <textarea
              id="job-description-context"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={5}
              placeholder="Paste the full job description here..."
              className="w-full bg-white/5 border border-white/20 rounded-lg p-3 text-sm outline-none resize-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {isLoading ? <Spinner text="Optimizing..." /> : (
            <button
              onClick={handleOptimize}
              disabled={!bulletPoint.trim() || !jobDescription.trim()}
              className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Optimize with AI
            </button>
          )}
          {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        </div>
      ) : (
        <div className="animate-fade-in">
            <h4 className="font-semibold text-sm mb-2">Here are a few suggestions:</h4>
            <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
                <div key={index} className="relative p-3 pl-10 bg-white/5 rounded-lg border border-white/20 text-sm">
                    <Lightbulb className="w-4 h-4 text-amber-400 absolute top-3.5 left-3" />
                    <p>{suggestion}</p>
                    <button onClick={() => handleCopy(suggestion, index)} className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/20 text-white/70">
                        <ClipboardCopy className="w-4 h-4"/>
                    </button>
                    {copiedIndex === index && <p className="text-xs text-green-400 text-right mt-1">Copied!</p>}
                </div>
            ))}
            </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Chip onClick={() => { setSuggestions([]); setBulletPoint(''); }}>Optimize another</Chip>
            <Chip onClick={() => setActiveView("interview-prep")}>Prepare for interview</Chip>
          </div>
        </div>
      )}
    </Card>
  );
};

export default BulletPointOptimizer;