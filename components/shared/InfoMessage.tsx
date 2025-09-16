import React from 'react';
import { Info, AlertTriangle, XCircle } from 'lucide-react';

interface InfoMessageProps {
  type: 'error' | 'warning' | 'info';
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const typeConfig = {
  error: {
    bg: 'bg-red-100',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: XCircle,
    hover: 'hover:bg-red-200',
  },
  warning: {
    bg: 'bg-amber-100',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: AlertTriangle,
    hover: 'hover:bg-amber-200',
  },
  info: {
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: Info,
    hover: 'hover:bg-blue-200',
  },
};

const InfoMessage: React.FC<InfoMessageProps> = ({ type, children, onClick, className = '' }) => {
  const config = typeConfig[type];
  const Icon = config.icon;
  
  const baseClasses = `w-full p-3 rounded-lg text-sm text-left flex items-start gap-3 border ${config.bg} ${config.border} ${config.text} ${className}`;
  
  if (onClick) {
    return (
      <button onClick={onClick} className={`${baseClasses} ${config.hover} transition-colors`}>
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <span className="flex-1">{children}</span>
      </button>
    );
  }

  return (
    <div className={baseClasses}>
      <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <span className="flex-1">{children}</span>
    </div>
  );
};

export default InfoMessage;