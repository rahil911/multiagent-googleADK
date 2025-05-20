import React, { ReactNode } from 'react';
import { useTheme } from '../../../../../../ui-common/design-system/theme';

interface ChartWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  height?: number | string;
  width?: number | string;
  isLoading?: boolean;
  className?: string;
  actions?: ReactNode;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  children,
  title,
  subtitle,
  height = 400,
  width = '100%',
  isLoading = false,
  className = '',
  actions,
}) => {
  const theme = useTheme();
  
  // Calculate a slightly smaller height when a number is provided
  const adjustedHeight = typeof height === 'number' ? height - 40 : height;

  return (
    <div 
      className={`chart-wrapper ${className}`}
      style={{
        backgroundColor: theme.colors.graphite,
        borderRadius: '16px',
        boxShadow: theme.shadows.md,
        overflow: 'hidden', // Keep hidden to enforce boundaries
        display: 'flex',
        flexDirection: 'column',
        width,
        height: typeof adjustedHeight === 'number' ? `${adjustedHeight}px` : adjustedHeight,
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* Header with title */}
      {(title || actions) && (
        <div 
          style={{
            padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
            borderBottom: `1px solid rgba(58, 68, 89, 0.5)`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0, // Prevent header from shrinking
            boxSizing: 'border-box',
          }}
        >
          <div>
            {title && (
              <h3 
                style={{
                  margin: 0,
                  color: theme.colors.cloudWhite,
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semiBold,
                  fontFamily: theme.typography.fontFamily,
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p 
                style={{
                  margin: '4px 0 0 0',
                  color: theme.colors.cloudWhite,
                  opacity: 0.7,
                  fontSize: theme.typography.fontSize.sm,
                  fontFamily: theme.typography.fontFamily,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="chart-actions">{actions}</div>
          )}
        </div>
      )}

      {/* Chart content */}
      <div 
        style={{
          flex: 1,
          padding: theme.spacing[4],
          position: 'relative',
          boxSizing: 'border-box',
          minHeight: 0, // Critical for flexbox children with percentage heights
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Keep to enforce boundaries
        }}
      >
        {isLoading ? (
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(10, 18, 36, 0.7)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1,
              backdropFilter: 'blur(2px)',
            }}
          >
            <div 
              style={{
                width: '40px',
                height: '40px',
                border: `3px solid #3a4459`,
                borderTop: `3px solid ${theme.colors.electricCyan}`,
                borderRadius: '50%',
                animation: 'chart-spin 1s linear infinite',
                boxShadow: `0 0 10px 2px ${theme.colors.electricCyan}30`,
              }}
            />
            <style jsx global>{`
              @keyframes chart-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : null}
        <div style={{ 
          width: '100%', 
          height: '100%',
          overflow: 'hidden', 
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0 // Critical for flex percentage-based content
        }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChartWrapper;