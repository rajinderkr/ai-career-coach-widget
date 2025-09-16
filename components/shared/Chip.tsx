
import React from 'react';

interface ChipProps {
  children: React.ReactNode;
  onClick: () => void;
}

const Chip: React.FC<ChipProps> = ({ children, onClick }) => {
  return (
    <button 
      onClick={onClick} 
      className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-brand"
    >
      {children}
    </button>
  );
};

export default Chip;