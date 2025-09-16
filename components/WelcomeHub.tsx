import React from 'react';
import { ActiveView, FeatureFlags, ChatMessage } from '../types';
import { ListChecks, FileText, Linkedin, MessageSquare, Briefcase, type LucideIcon } from 'lucide-react';

interface WelcomeHubProps {
  startAction: (view: ActiveView) => void;
  featureFlags: FeatureFlags | null;
  chatHistory: ChatMessage[];
}

const iconMap: { [key: string]: LucideIcon } = {
  ListChecks,
  FileText,
  Linkedin,
  MessageSquare,
  Briefcase,
};

const WelcomeHub: React.FC<WelcomeHubProps> = ({ startAction, featureFlags, chatHistory }) => {
  
  const CategoryCard: React.FC<{ category: any }> = ({ category }) => {
    const IconComponent = iconMap[category.icon];
    
    if (!category.enabled) return null;
    
    const enabledFeatures = category.features.filter((f: any) => f.enabled);
    if (enabledFeatures.length === 0) return null;

    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-3">
          {IconComponent && <IconComponent className="w-5 h-5 text-brand" />}
          <h3 className="font-semibold text-gray-900">{category.title}</h3>
        </div>
        <div className="flex flex-col gap-2">
          {enabledFeatures.map((feature: any) => (
            <button
              key={feature.view}
              onClick={() => startAction(feature.view)}
              className="w-full text-left text-sm px-3 py-2 rounded-md bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
            >
              {feature.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (!featureFlags) {
      return null;
  }
  
  // FIX: Cast `cat` to `any` to bypass TypeScript error where `enabled` and `features` were not recognized on type `object`.
  const enabledCategories = Object.values(featureFlags).filter(cat => typeof cat === 'object' && cat && (cat as any).enabled && (cat as any).features.some((f: any) => f.enabled));

  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid grid-cols-5 gap-4">
          {enabledCategories.map(cat => <CategoryCard key={(cat as any).title} category={cat} />)}
      </div>
    </div>
  );
};

export default WelcomeHub;