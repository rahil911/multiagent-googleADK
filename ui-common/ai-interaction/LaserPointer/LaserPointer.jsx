import React, { useState, useEffect } from 'react';
import { useTheme } from '../../design-system/theme';

/**
 * LaserPointer Component
 * 
 * Creates a laser pointer effect between two points, typically from the robot's
 * eye to a specific element on a chart or visualization.
 * 
 * Features:
 * - Dynamic laser that follows target point
 * - Different colors based on who's pointing (AI vs user)
 * - Pulsing animation for emphasis
 * - End point dot for precise targeting
 */
export const LaserPointer = ({
  origin, // { x, y } coordinates of laser origin (robot eye)
  target, // { x, y } coordinates of target point
  color = '#ff1f4f', // Default red color
  width = 2,
  pulsing = true,
  endPointRadius = 4,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  // Calculate angle between origin and target
  const getAngleDegrees = () => {
    if (!origin || !target) return 0;
    return Math.atan2(target.y - origin.y, target.x - origin.x) * (180 / Math.PI);
  };

  // Calculate distance between origin and target
  const getDistance = () => {
    if (!origin || !target) return 0;
    return Math.sqrt(
      Math.pow(target.x - origin.x, 2) + Math.pow(target.y - origin.y, 2)
    );
  };

  // Animate the laser appearance
  useEffect(() => {
    if (origin && target) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
      return () => clearTimeout(timer);
    }
  }, [origin, target]);

  if (!origin || !target) return null;

  const angle = getAngleDegrees();
  const distance = getDistance();

  // For positioning, we need to account for the width of the line
  // so that it starts exactly at the origin point
  const laserStyles = {
    position: 'absolute',
    transformOrigin: '0 50%',
    left: `${origin.x}px`,
    top: `${origin.y}px`,
    height: `${width}px`,
    width: `${distance}px`,
    transform: `rotate(${angle}deg)`,
    backgroundColor: color,
    borderRadius: '50px',
    opacity: isVisible ? 1 : 0,
    transition: theme.transitions.robot.laser,
    zIndex: theme.zIndex[60],
    boxShadow: pulsing ? `0 0 5px 1px ${color}` : 'none',
    animation: pulsing ? 'laserPulsing 0.8s infinite alternate' : 'none',
  };

  // End point dot for precise targeting
  const endPointStyles = {
    position: 'absolute',
    left: `${target.x - endPointRadius}px`,
    top: `${target.y - endPointRadius}px`,
    width: `${endPointRadius * 2}px`,
    height: `${endPointRadius * 2}px`,
    borderRadius: '50%',
    backgroundColor: color,
    zIndex: theme.zIndex[60] + 1,
    boxShadow: `0 0 5px 1px ${color}`,
    animation: pulsing ? 'endPointPulsing 0.8s infinite alternate' : 'none',
  };

  return (
    <>
      <div className="laser" style={laserStyles} />
      <div className="end-point" style={endPointStyles} />

      {/* Animations for laser and end point */}
      <style jsx global>{`
        @keyframes laserPulsing {
          0% { opacity: 0.7; height: ${width}px; }
          100% { opacity: 1; height: ${width + 1}px; }
        }
        
        @keyframes endPointPulsing {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default LaserPointer; 