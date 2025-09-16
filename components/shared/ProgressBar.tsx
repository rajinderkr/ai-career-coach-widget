
import React from 'react';
import { CheckCircle, Loader } from 'lucide-react';

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 my-6 animate-fade-in">
      <div className="w-full max-w-md">
        <div className="flex justify-between mb-1">
          {steps.map((_, index) => (
            <div key={index} className="flex-1 h-1 bg-gray-200 rounded-full mx-1">
              <div
                className={`h-1 rounded-full ${index < currentStep ? 'bg-green-500' : index === currentStep ? 'bg-brand' : 'bg-transparent'}`}
                style={{
                  width: index === currentStep ? '50%' : '100%',
                  transition: 'width 0.5s ease-in-out, background-color 0.5s ease-in-out',
                }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
            {currentStep < steps.length ? (
                <Loader className="w-4 h-4 animate-spin text-brand" />
            ) : (
                 <CheckCircle className="w-4 h-4 text-green-500" />
            )}
            <p>
                <b>Step {Math.min(currentStep + 1, steps.length)} of {steps.length}:</b> {steps[currentStep] || "Finalizing..."}
            </p>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;