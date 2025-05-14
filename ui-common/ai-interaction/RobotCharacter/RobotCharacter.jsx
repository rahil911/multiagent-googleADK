import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../design-system/theme';
import { LaserPointer } from '../LaserPointer/LaserPointer';
import { SpeechBubble } from '../SpeechBubble/SpeechBubble';

/**
 * Robot Character Component
 * 
 * A draggable robot assistant that can interact with charts and provide explanations.
 * Features:
 * - Draggable character that can be positioned anywhere on screen
 * - Laser pointer capability for pointing at chart elements
 * - Speech bubble for showing explanations or thoughts
 * - Different states: idle, thinking, speaking, pointing
 */
export const RobotCharacter = ({
  initialPosition = { x: 20, y: 20 },
  laserTarget = null,
  isVisible = true,
  message = null,
  state = 'idle', // 'idle', 'thinking', 'speaking', 'pointing'
  laserColor = 'red', // 'red' for AI, 'green' for user
  className = '',
}) => {
  const theme = useTheme();
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const robotRef = useRef(null);
  const containerRef = useRef(null);
  
  // Used to calculate the robot's "eye" position for laser origin
  const getRobotEyePosition = () => {
    if (!robotRef.current) return { x: 0, y: 0 };
    
    const robotRect = robotRef.current.getBoundingClientRect();
    return {
      x: robotRect.left + (robotRect.width / 2) - 4, // Center of robot, slight offset for eye
      y: robotRect.top + (robotRect.height / 3),     // Approximately where the eye would be
    };
  };
  
  // Handle mouse down on robot (start dragging)
  const handleMouseDown = (e) => {
    if (!robotRef.current) return;
    
    const robotRect = robotRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - robotRect.left,
      y: e.clientY - robotRect.top,
    });
    
    setIsDragging(true);
    e.preventDefault();
  };
  
  // Handle mouse move (continue dragging)
  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - dragOffset.x - containerRect.left;
    const newY = e.clientY - dragOffset.y - containerRect.top;
    
    // Make sure robot stays within bounds
    const robotWidth = robotRef.current.offsetWidth;
    const robotHeight = robotRef.current.offsetHeight;
    
    const boundedX = Math.max(0, Math.min(newX, containerRect.width - robotWidth));
    const boundedY = Math.max(0, Math.min(newY, containerRect.height - robotHeight));
    
    setPosition({ x: boundedX, y: boundedY });
  };
  
  // Handle mouse up (end dragging)
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);
  
  // Handle laser pointer logic
  const [laserOrigin, setLaserOrigin] = useState({ x: 0, y: 0 });
  
  // Update laser origin when position changes
  useEffect(() => {
    setLaserOrigin(getRobotEyePosition());
  }, [position]);
  
  // Set up regular updates of eye position
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (state === 'pointing' && laserTarget) {
        setLaserOrigin(getRobotEyePosition());
      }
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [state, laserTarget]);
  
  // Robot appearance based on state
  const getRobotStyles = () => {
    const baseStyles = {
      width: '44px',
      height: '65px',
      position: 'absolute',
      left: `${position.x}px`,
      top: `${position.y}px`,
      cursor: 'move',
      zIndex: theme.zIndex[60],
      transition: isDragging ? 'none' : theme.transitions.robot.movement,
    };
    
    // Additional styles based on state
    if (state === 'thinking') {
      return {
        ...baseStyles,
        animation: 'robotThinking 1s infinite alternate',
      };
    }
    
    if (state === 'speaking') {
      return {
        ...baseStyles,
        animation: 'robotSpeaking 0.5s infinite alternate',
      };
    }
    
    if (state === 'pointing') {
      return {
        ...baseStyles,
        animation: 'robotPointing 0.3s ease-out 1 forwards',
      };
    }
    
    return baseStyles;
  };
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  return (
    <div ref={containerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: theme.zIndex[60] }}>
      {/* Robot Character */}
      <div
        ref={robotRef}
        className={`robot-character ${className}`}
        style={getRobotStyles()}
        onMouseDown={handleMouseDown}
        onTouchStart={handleMouseDown}
      >
        <svg viewBox="0 0 44 65" xmlns="http://www.w3.org/2000/svg" style={{ pointerEvents: 'auto' }}>
          {/* Robot Body */}
          <rect x="8" y="20" width="28" height="35" rx="6" fill={theme.colors.graphiteLight} stroke={theme.colors.graphite} strokeWidth="2" />
          
          {/* Robot Head */}
          <rect x="10" y="5" width="24" height="20" rx="5" fill={theme.colors.graphiteLight} stroke={theme.colors.graphite} strokeWidth="2" />
          
          {/* Robot Eye */}
          <circle cx="22" cy="15" r="6" fill={theme.colors.midnightNavy} />
          <circle 
            cx="22" 
            cy="15" 
            r="3" 
            fill={laserColor === 'red' ? theme.colors.signalMagenta : theme.colors.success} 
          />
          
          {/* Robot Antenna */}
          <rect x="20" y="1" width="4" height="6" rx="2" fill={theme.colors.graphiteLight} />
          <circle 
            cx="22" 
            cy="2" 
            r="3" 
            fill={state === 'thinking' || state === 'speaking' ? theme.colors.electricCyan : theme.colors.graphiteLight} 
          />
          
          {/* Robot Arms */}
          <rect x="2" y="25" width="6" height="20" rx="3" fill={theme.colors.graphiteLight} stroke={theme.colors.graphite} strokeWidth="1" />
          <rect x="36" y="25" width="6" height="20" rx="3" fill={theme.colors.graphiteLight} stroke={theme.colors.graphite} strokeWidth="1" />
          
          {/* Robot Legs */}
          <rect x="12" y="55" width="6" height="10" rx="3" fill={theme.colors.graphiteLight} stroke={theme.colors.graphite} strokeWidth="1" />
          <rect x="26" y="55" width="6" height="10" rx="3" fill={theme.colors.graphiteLight} stroke={theme.colors.graphite} strokeWidth="1" />
          
          {/* Robot Details */}
          <rect x="14" y="30" width="16" height="6" rx="2" fill={theme.colors.electricCyan} opacity="0.6" />
          <circle cx="17" cy="40" r="2" fill={theme.colors.electricCyan} />
          <circle cx="27" cy="40" r="2" fill={theme.colors.electricCyan} />
        </svg>
      </div>
      
      {/* Laser Pointer */}
      {state === 'pointing' && laserTarget && (
        <LaserPointer 
          origin={laserOrigin}
          target={laserTarget}
          color={laserColor === 'red' ? theme.colors.signalMagenta : theme.colors.success}
          pulsing={state === 'pointing'}
        />
      )}
      
      {/* Speech Bubble */}
      {(state === 'speaking' || state === 'thinking') && message && (
        <SpeechBubble
          anchorElement={robotRef.current}
          message={message}
          isThinking={state === 'thinking'}
          position="right"
        />
      )}
      
      {/* Global styles for animations */}
      <style jsx global>{`
        @keyframes robotThinking {
          0% { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(2px) rotate(3deg); }
        }
        
        @keyframes robotSpeaking {
          0% { transform: translateY(0px); }
          100% { transform: translateY(2px); }
        }
        
        @keyframes robotPointing {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default RobotCharacter; 