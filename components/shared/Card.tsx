import React from 'react';

interface CardProps {
  // FIX: Allow title to be a ReactNode to support complex titles with buttons.
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl p-4 border border-gray-200 shadow-sm ${className}`}>
      {/* FIX: Changed h6 to div to accommodate complex ReactNode titles. */}
      {title && <div className="text-sm font-bold mb-3 text-gray-800">{title}</div>}
      {children}
    </div>
  );
};

export default Card;