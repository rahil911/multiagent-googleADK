import React from 'react';

interface ConfidenceSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

const ConfidenceSlider: React.FC<ConfidenceSliderProps> = ({
  value,
  onChange,
  min = 50,
  max = 95,
  step = 5,
}) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-cloud-white">Confidence Level</span>
        <span className="text-electric-cyan font-semibold">{value}%</span>
      </div>
      
      <div className="flex items-center space-x-2">
        <span className="text-xs text-cloud-white opacity-70">{min}%</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="flex-1 h-2 bg-midnight-navy rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-xs text-cloud-white opacity-70">{max}%</span>
      </div>
      
      <div className="flex justify-between text-xs text-cloud-white opacity-50 mt-1">
        <span>Wider interval</span>
        <span>Narrower interval</span>
      </div>
      
      <div className="text-xs text-cloud-white opacity-70 mt-2 text-center">
        {value < 70 
          ? "Lower confidence shows wider prediction range with greater uncertainty"
          : value < 85
            ? "Balanced confidence provides moderate prediction range"
            : "Higher confidence provides narrower range but higher risk of actual results falling outside"}
      </div>
    </div>
  );
};

export default ConfidenceSlider;