
import React, { useState, useRef, useEffect } from 'react';
import Card from '../shared/Card';
import { UserProfile, ActiveView, SWOT, ActionItem } from '../../types';
import { TrendingUp, AlertTriangle, ShieldCheck, Zap, ChevronsUp, ChevronUp, Minus, GraduationCap, Calendar, Star, Download } from 'lucide-react';
import WorkshopCtaCard from '../shared/WorkshopCtaCard';

interface PlacementPlanProps {
  profile: UserProfile;
  setActiveView: (view: ActiveView) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

const priorityMap: { [key in 'High' | 'Medium' | 'Low']: { icon: React.ElementType, color: string } } = {
    'High': { icon: ChevronsUp, color: 'text-red-500' },
    'Medium': { icon: ChevronUp, color: 'text-amber-500' },
    'Low': { icon: Minus, color: 'text-blue-500' }
};

const swotMap = {
    strengths: { icon: ShieldCheck, color: 'text-green-600', title: 'Strengths' },
    weaknesses: { icon: AlertTriangle, color: 'text-amber-600', title: 'Weaknesses' },
    opportunities: { icon: TrendingUp, color: 'text-blue-600', title: 'Opportunities' },
    threats: { icon: Zap, color: 'text-red-600', title: 'Threats' }
};

const EditableTimeline: React.FC<{ item: ActionItem; index: number; onUpdate: (index: number, newTimeline: string) => void; }> = ({ item, index, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.timeline);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        onUpdate(index, text);
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => { if (e.key === 'Enter') handleBlur(); }}
                className="bg-white border border-brand rounded px-1 py-0 text-xs w-28"
            />
        );
    }

    return (
        <span onClick={() => setIsEditing(true)} className="cursor-pointer hover:bg-gray-100 p-1 rounded">
            {item.timeline}
        </span>
    );
};


const ActionPlanView: React.FC<{ plan: ActionItem[]; onUpdateTimeline: (index: number, newTimeline: string) => void }> = ({ plan, onUpdateTimeline }) => (
    <div className="space-y-4">
        {plan.map((item, index) => {
            const { icon: Icon, color } = priorityMap[item.priority] || priorityMap['Medium'];
            return (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${color}`} />
                        <div>
                            <p className={`text-xs font-bold uppercase ${color}`}>{item.priority} Priority</p>
                            <p className="text-sm mt-1 text-gray-800">{item.action}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pl-8 text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Timeline: </span>
                            <EditableTimeline item={item} index={index} onUpdate={onUpdateTimeline} />
                        </div>
                         {item.skillRating && (
                            <div className="flex items-center gap-2">
                                <Star className="w-3.5 h-3.5" />
                                <span>Self-Rated Skill: {item.skillRating}/10</span>
                            </div>
                        )}
                    </div>
                    {item.courseName && item.courseUrl && (
                         <div className="mt-3 ml-8 border-t border-gray-200 pt-3">
                             <h5 className="text-xs font-semibold mb-2 text-gray-700">Course Recommendation</h5>
                             <a 
                                href={item.courseUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-md bg-brand/10 hover:bg-brand/20 transition-colors border border-brand/20"
                            >
                                <GraduationCap className="w-5 h-5 text-brand flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{item.courseName}</p>
                                    <p className="text-xs text-brand">Click to learn more</p>
                                </div>
                             </a>
                         </div>
                    )}
                </div>
            );
        })}
    </div>
);

const SwotView: React.FC<{ swot: SWOT }> = ({ swot }) => (
    <div className="grid md:grid-cols-2 gap-4">
        {(Object.keys(swot) as Array<keyof SWOT>).map(key => {
            const { icon: Icon, color, title } = swotMap[key];
            return (
                <div key={key} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Icon className={`w-5 h-5 ${color}`} />
                        <h4 className={`font-bold text-md ${color}`}>{title}</h4>
                    </div>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-700">
                        {(swot[key] ?? []).map((point, i) => <li key={i}>{point}</li>)}
                    </ul>
                </div>
            );
        })}
    </div>
);

const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

const PlacementPlan: React.FC<PlacementPlanProps> = ({ profile, setActiveView, updateProfile }) => {
  const [activeTab, setActiveTab] = useState<'swot' | 'plan'>('plan');

  if (!profile.placementPlan) {
    return (
      <Card title="Step 2: Your Placement Plan">
        <p className="text-sm text-gray-600 mb-4">Something went wrong. Your placement plan could not be generated.</p>
        <button
            onClick={() => setActiveView('skill-assessment')}
            className="px-4 py-2 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
        >
            Back to Skill Assessment
        </button>
      </Card>
    );
  }
  
  const { swot, actionPlan } = profile.placementPlan;
  const safeSwot = swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] };
  const safeActionPlan = actionPlan || [];

  const handleUpdateTimeline = (index: number, newTimeline: string) => {
      if (!profile.placementPlan) return;
      const newActionPlan = [...profile.placementPlan.actionPlan];
      newActionPlan[index].timeline = newTimeline;
      updateProfile({ placementPlan: { ...profile.placementPlan, actionPlan: newActionPlan }});
  };

  const downloadSwotAsCsv = () => {
    const headers = ['Strengths', 'Weaknesses', 'Opportunities', 'Threats'];
    const { strengths, weaknesses, opportunities, threats } = safeSwot;
    const maxLength = Math.max(strengths.length, weaknesses.length, opportunities.length, threats.length);
    let csvContent = headers.join(',') + '\n';
    
    for (let i = 0; i < maxLength; i++) {
        const row = [
            `"${strengths[i] || ''}"`,
            `"${weaknesses[i] || ''}"`,
            `"${opportunities[i] || ''}"`,
            `"${threats[i] || ''}"`
        ];
        csvContent += row.join(',') + '\n';
    }
    downloadCSV(csvContent, `SWOT_Analysis_${profile.jobTitle.replace(/\s+/g, '_')}.csv`);
  };

  const downloadActionPlanAsCsv = () => {
    const headers = ['Priority', 'Action', 'Timeline', 'Self-Rated Skill', 'Suggested Course', 'Course URL'];
    let csvContent = headers.join(',') + '\n';
    
    safeActionPlan.forEach(item => {
        const row = [
            `"${item.priority}"`,
            `"${item.action.replace(/"/g, '""')}"`, // Escape double quotes
            `"${item.timeline}"`,
            `"${item.skillRating || 'N/A'}"`,
            `"${item.courseName || ''}"`,
            `"${item.courseUrl || ''}"`
        ];
        csvContent += row.join(',') + '\n';
    });
    downloadCSV(csvContent, `Action_Plan_${profile.jobTitle.replace(/\s+/g, '_')}.csv`);
  };


  const completeStep = () => {
    const updatedCompletedSteps = [...new Set<ActiveView>([...profile.completedSteps, 'placement-plan'])];
    updateProfile({ completedSteps: updatedCompletedSteps });
    setActiveView('welcome');
  };

  return (
    <>
      <Card title={`Placement Plan for ${profile.jobTitle}`}>
        <div className="flex border-b border-gray-200 mb-4 items-center">
          <div className="flex-1">
            <button onClick={() => setActiveTab('plan')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'plan' ? 'text-brand border-b-2 border-brand' : 'text-gray-500 hover:text-gray-800'}`}>Action Plan</button>
            <button onClick={() => setActiveTab('swot')} className={`px-4 py-2 text-sm font-semibold transition-colors ${activeTab === 'swot' ? 'text-brand border-b-2 border-brand' : 'text-gray-500 hover:text-gray-800'}`}>SWOT Analysis</button>
          </div>
          <div className="flex items-center gap-2">
              <button onClick={downloadSwotAsCsv} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200">
                  <Download className="w-3.5 h-3.5" />
                  Download SWOT
              </button>
              <button onClick={downloadActionPlanAsCsv} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md hover:bg-gray-100 text-gray-600 transition-colors border border-gray-200">
                  <Download className="w-3.5 h-3.5" />
                  Download Plan
              </button>
          </div>
        </div>

        <div className="animate-fade-in">
          {activeTab === 'swot' && <SwotView swot={safeSwot} />}
          {activeTab === 'plan' && <ActionPlanView plan={safeActionPlan} onUpdateTimeline={handleUpdateTimeline}/>}
        </div>
        
        {activeTab === 'plan' ? (
          <button
              onClick={() => setActiveTab('swot')}
              className="mt-6 w-full px-3 py-2.5 rounded-lg bg-brand text-white text-sm font-semibold hover:bg-brand-dark transition-colors"
          >
              Go to SWOT Analysis
          </button>
        ) : (
          <button
              onClick={completeStep}
              className="mt-6 w-full px-3 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Back to Dashboard
          </button>
        )}
      </Card>
      <WorkshopCtaCard />
    </>
  );
};

export default PlacementPlan;
