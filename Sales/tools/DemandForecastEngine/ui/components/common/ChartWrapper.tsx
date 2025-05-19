import React, { ReactNode } from 'react';

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
  height?: string | number;
  loading?: boolean;
  loadingMessage?: string;
  actions?: ReactNode;
  className?: string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  title,
  children,
  height = 300,
  loading = false,
  loadingMessage = 'Loading data...',
  actions,
  className = '',
}) => {
  return (
    <div className={`bg-graphite rounded-xl p-4 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-cloud-white">{title}</h3>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
      
      <div 
        className="relative" 
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
      >
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-electric-cyan rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-electric-cyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-electric-cyan rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
              <p className="text-electric-cyan mt-2">{loadingMessage}</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default ChartWrapper;