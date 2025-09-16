
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', text }) => {
    const sizeClasses = {
        sm: 'w-5 h-5',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 my-4">
            <div
                className={`${sizeClasses[size]} border-t-2 border-b-2 border-brand rounded-full animate-spin`}
            ></div>
            {text && <p className="text-sm text-gray-600 animate-pulse">{text}</p>}
        </div>
    );
};

export default Spinner;