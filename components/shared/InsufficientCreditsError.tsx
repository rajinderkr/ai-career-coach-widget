import React from 'react';

interface InsufficientCreditsErrorProps {
  cost: number;
  credits: number;
}

const InsufficientCreditsError: React.FC<InsufficientCreditsErrorProps> = ({ cost, credits }) => {
  return (
    <div className="text-center p-4 mt-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-sm text-red-700 font-semibold mb-1">
        Insufficient Credits
      </p>
      <p className="text-xs text-red-600">
        You need {cost} credits for this action, but you only have {credits}. Your credits will reset to 30 tomorrow.
      </p>
    </div>
  );
};

export default InsufficientCreditsError;