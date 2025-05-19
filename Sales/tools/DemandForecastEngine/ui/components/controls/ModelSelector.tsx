import React from 'react';
import { ModelType } from '../../types';

interface ModelSelectorProps {
  selectedModel: ModelType;
  onChange: (model: ModelType) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onChange,
}) => {
  const models: { id: ModelType; label: string; description: string }[] = [
    {
      id: 'movingAverage',
      label: 'Moving Average',
      description: 'Simple model that averages data points over a specific time window',
    },
    {
      id: 'exponentialSmoothing',
      label: 'Exp. Smoothing',
      description: 'Weights recent observations more heavily with exponentially decreasing weights',
    },
    {
      id: 'arima',
      label: 'ARIMA',
      description: 'AutoRegressive Integrated Moving Average model for time series forecasting',
    },
    {
      id: 'machineLearning',
      label: 'Machine Learning',
      description: 'Advanced ML models that incorporate multiple variables and pattern recognition',
    },
  ];

  return (
    <div>
      <div className="flex rounded-full bg-midnight-navy p-1">
        {models.map(({ id, label }) => (
          <button
            key={id}
            className={`flex-1 px-3 py-2 rounded-full transition-colors ${
              selectedModel === id
                ? 'bg-electric-cyan text-midnight-navy'
                : 'text-cloud-white hover:bg-graphite'
            }`}
            onClick={() => onChange(id)}
            title={models.find(m => m.id === id)?.description}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="mt-2 text-xs text-cloud-white opacity-70 text-center">
        {models.find(m => m.id === selectedModel)?.description}
      </div>
    </div>
  );
};

export default ModelSelector;