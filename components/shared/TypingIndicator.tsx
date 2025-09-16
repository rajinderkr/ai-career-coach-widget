import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-1.5 p-3">
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0s' }}></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0.2s' }}></div>
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0.4s' }}></div>
    </div>
  );
};

export default TypingIndicator;