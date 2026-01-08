import React from 'react';

interface ProgressBarProps {
    progress: number;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = '' }) => (
    <div className={`w-full bg-gray-700 h-2 rounded-full overflow-hidden ${className}`}>
        <div
            className="bg-green-500 h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
        />
    </div>
);