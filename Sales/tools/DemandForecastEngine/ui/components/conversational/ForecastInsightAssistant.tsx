import React, { useState, useEffect, useRef } from 'react';
import { ForecastHorizon, ForecastMetric, DimensionFilter } from '../../types';

interface ForecastInsightAssistantProps {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
  onClose: () => void;
}

interface InsightMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface Thoughtlet {
  id: string;
  content: string;
  position: 'top' | 'right' | 'bottom' | 'left';
  relatedElement?: string;
}

const ForecastInsightAssistant: React.FC<ForecastInsightAssistantProps> = ({
  horizon,
  metric,
  filters,
  onClose,
}) => {
  const [messages, setMessages] = useState<InsightMessage[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: `Welcome to the Forecast Insights Assistant. I can help you analyze forecast patterns, compare scenarios, explain errors, and identify risks. What would you like to know about the ${horizon} ${metric} forecast?`,
      timestamp: new Date(),
    },
  ]);
  
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [thoughtlets, setThoughtlets] = useState<Thoughtlet[]>([]);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages when new ones are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate some initial thoughtlets
  useEffect(() => {
    const initialThoughtlets: Thoughtlet[] = [
      {
        id: 'seasonal-pattern',
        content: 'December shows the strongest seasonal pattern with 30% higher demand than average',
        position: 'right',
      },
      {
        id: 'forecast-accuracy',
        content: 'Forecast accuracy is improving and is now 5% higher than last month',
        position: 'top',
      },
    ];
    
    setThoughtlets(initialThoughtlets);
    
    // Add recent commands
    setRecentCommands([
      '/analyze-forecast monthly',
      '/identify-risks',
      '/compare-scenarios Baseline High-Growth',
      '/explain-error 2023-12',
    ]);
  }, []);

  // Handle message submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: InsightMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    // Add temporary assistant message with loading state
    const loadingMessage: InsightMessage = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    
    setMessages([...messages, userMessage, loadingMessage]);
    setInput('');
    setLoading(true);
    
    // Simulate response delay
    setTimeout(() => {
      // Replace loading message with actual response
      const generatedResponse = generateResponse(input, horizon, metric);
      
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === loadingMessage.id 
            ? { ...msg, content: generatedResponse, isLoading: false }
            : msg
        )
      );
      
      setLoading(false);
    }, 1000);
  };

  // Generate response based on user input and context
  const generateResponse = (userInput: string, horizon: ForecastHorizon, metric: ForecastMetric): string => {
    const input = userInput.toLowerCase();
    
    // Handle slash commands
    if (input.startsWith('/analyze-forecast')) {
      return `Based on my analysis of the ${horizon} ${metric} forecast, I've identified several key patterns:
      
1. The overall trend is showing a ${Math.random() > 0.5 ? 'positive' : 'slightly decreasing'} growth rate of ${(Math.random() * 10).toFixed(1)}% compared to the previous period.

2. Seasonal patterns remain significant, with the strongest effect in December (+30%) and the weakest in February (-15%).

3. Confidence intervals are ${Math.random() > 0.5 ? 'narrowing' : 'widening'}, indicating ${Math.random() > 0.5 ? 'improving' : 'decreasing'} forecast stability.

Would you like me to examine any specific aspect in more detail?`;
    }
    
    if (input.startsWith('/compare-scenarios')) {
      return `I've compared the baseline scenario with the high-growth scenario:

• The high-growth scenario shows a ${(10 + Math.random() * 10).toFixed(1)}% higher end-point forecast.
• The largest divergence occurs in Q3, where the difference reaches ${(15 + Math.random() * 10).toFixed(1)}%.
• Price adjustments account for 40% of the difference, while growth assumptions account for 60%.
• Risk assessment: The high-growth scenario has a ${(30 + Math.random() * 20).toFixed(1)}% probability based on historical patterns.

Would you like to see how specific drivers differ between these scenarios?`;
    }
    
    if (input.startsWith('/explain-error')) {
      return `I analyzed the forecast error for the selected period and found these key factors:

1. Unexpected promotional activity from competitors contributed to approximately 45% of the error.
2. Seasonal pattern shift (earlier than expected) contributed to 30% of the error.
3. Unaccounted price elasticity effect contributed to 15% of the error.
4. Random variation accounts for the remaining 10%.

To improve future forecasts, I recommend adjusting the seasonal pattern detection and monitoring competitive promotional activities more closely.`;
    }
    
    if (input.startsWith('/identify-risks')) {
      return `Based on current forecast patterns, I've identified these key risks:

• **Supply Chain Impact**: There's a ${(60 + Math.random() * 20).toFixed(0)}% probability of stock shortages in Q3 if the high-growth scenario materializes.

• **Revenue Volatility**: Seasonal factors may have ${Math.random() > 0.5 ? 'greater' : 'less'} impact than expected, with a potential variance of ±${(5 + Math.random() * 10).toFixed(1)}%.

• **Competitive Pressure**: Recent market shifts suggest potential for increased competitive activity, which could impact demand by up to ${(5 + Math.random() * 10).toFixed(1)}%.

Would you like me to generate a detailed risk mitigation plan?`;
    }
    
    // Handle general questions
    if (input.includes('accuracy') || input.includes('error')) {
      return `The current forecast model is achieving ${(75 + Math.random() * 15).toFixed(1)}% accuracy overall, with a MAPE of ${(5 + Math.random() * 5).toFixed(1)}%. Error rates are ${Math.random() > 0.5 ? 'improving' : 'stable'} compared to previous forecasts. The most significant improvements have been in ${Math.random() > 0.5 ? 'seasonal adjustment' : 'trend detection'}.`;
    }
    
    if (input.includes('seasonal') || input.includes('season')) {
      return `The seasonal pattern analysis shows significant monthly variations in ${metric}. The strongest seasonality occurs in December (+30%), followed by November (+15%) and July (+10%). The lowest periods are February (-15%) and March (-10%). The overall seasonal strength is rated at ${(70 + Math.random() * 20).toFixed(0)}%, indicating it's a major factor in your demand patterns.`;
    }
    
    if (input.includes('trend') || input.includes('growth')) {
      return `The long-term trend for ${metric} shows a ${Math.random() > 0.5 ? 'positive' : 'slightly negative'} growth rate of ${(Math.random() * 8).toFixed(1)}% annually. Over the ${horizon} horizon, this translates to approximately ${(Math.random() * 5).toFixed(1)}% growth per period. The trend component accounts for about ${(30 + Math.random() * 20).toFixed(0)}% of your forecast pattern.`;
    }
    
    if (input.includes('driver') || input.includes('factor')) {
      return `The primary demand drivers identified in the forecast are:
      
1. Base demand (${(40 + Math.random() * 10).toFixed(1)}%)
2. Seasonal factors (${(20 + Math.random() * 5).toFixed(1)}%)
3. Promotional effects (${(15 + Math.random() * 5).toFixed(1)}%)
4. Price effects (${(10 + Math.random() * 5).toFixed(1)}%)
5. Other factors (${(5 + Math.random() * 5).toFixed(1)}%)

The most influential driver for the upcoming period is ${Math.random() > 0.5 ? 'seasonal factors' : 'promotional effects'} with a projected impact of ${(10 + Math.random() * 15).toFixed(1)}%.`;
    }
    
    if (input.includes('recommend') || input.includes('suggestion') || input.includes('optimize')) {
      return `Based on the current forecast patterns, here are my top recommendations:

1. **Increase inventory levels** for ${Math.random() > 0.5 ? 'December' : 'July'} by ${(10 + Math.random() * 15).toFixed(0)}% to accommodate expected seasonal peaks.

2. **Adjust promotional timing** to better align with seasonal demand patterns, particularly in the transition from Q${Math.floor(Math.random() * 3) + 1} to Q${Math.floor(Math.random() * 3) + 2}.

3. **Review price elasticity assumptions** as the current model may be ${Math.random() > 0.5 ? 'underestimating' : 'overestimating'} the impact by approximately ${(5 + Math.random() * 10).toFixed(1)}%.

Would you like me to develop a detailed implementation plan for any of these recommendations?`;
    }
    
    // Default response
    return `I've analyzed the ${horizon} ${metric} forecast with the current filters applied. The overall pattern shows ${Math.random() > 0.5 ? 'stable growth' : 'seasonal fluctuations'} with a confidence level of ${(70 + Math.random() * 20).toFixed(0)}%. Would you like me to examine any specific aspect such as seasonality, error components, or key drivers?`;
  };

  // Handle slash command select
  const handleSlashCommand = (command: string) => {
    setInput(command);
  };

  // Rendering loading indicators for assistant messages
  const renderMessageContent = (message: InsightMessage) => {
    if (message.isLoading) {
      return (
        <div className="flex space-x-2 h-6 items-center">
          <div className="w-2 h-2 bg-electric-cyan rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-electric-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-electric-cyan rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      );
    }
    
    return <div className="whitespace-pre-line">{message.content}</div>;
  };

  return (
    <div className="flex flex-col h-full bg-graphite rounded-l-xl">
      {/* Header */}
      <div className="p-4 border-b border-midnight-navy flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-electric-cyan flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-midnight-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-cloud-white">Forecast Insights</h2>
        </div>
        <button 
          className="text-cloud-white hover:text-electric-cyan"
          onClick={onClose}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message) => (
          <div 
            key={message.id}
            className={`mb-4 ${message.type === 'user' ? 'text-right' : ''}`}
          >
            <div 
              className={`inline-block rounded-lg p-3 max-w-xs sm:max-w-sm ${
                message.type === 'user' 
                  ? 'bg-electric-cyan text-midnight-navy ml-auto' 
                  : 'bg-midnight-navy text-cloud-white'
              }`}
            >
              {renderMessageContent(message)}
            </div>
            <div 
              className={`text-xs text-cloud-white opacity-50 mt-1 ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Command Palette */}
      {input.startsWith('/') && (
        <div className="bg-midnight-navy border-t border-graphite p-2">
          <div className="text-xs text-cloud-white opacity-70 mb-1">Available commands:</div>
          <div className="grid grid-cols-1 gap-1">
            {[
              '/analyze-forecast [period]',
              '/compare-scenarios [scenario1] [scenario2]',
              '/explain-error [date]',
              '/optimize-model [parameter]',
              '/identify-risks',
            ].map((command) => (
              <button
                key={command}
                className="text-left p-2 hover:bg-graphite text-electric-cyan rounded text-sm"
                onClick={() => handleSlashCommand(command)}
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Recent Commands */}
      {!input.startsWith('/') && recentCommands.length > 0 && (
        <div className="bg-midnight-navy border-t border-graphite p-2">
          <div className="text-xs text-cloud-white opacity-70 mb-1">Recent queries:</div>
          <div className="flex flex-wrap gap-1">
            {recentCommands.map((command) => (
              <button
                key={command}
                className="text-xs bg-graphite text-cloud-white px-2 py-1 rounded hover:bg-electric-cyan hover:text-midnight-navy transition-colors"
                onClick={() => handleSlashCommand(command)}
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-midnight-navy">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about forecast..."
            className="flex-1 bg-midnight-navy text-cloud-white p-3 rounded-l-lg focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            className="bg-electric-cyan text-midnight-navy px-4 rounded-r-lg font-semibold"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" transform="rotate(90 12 12)" />
            </svg>
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-cloud-white opacity-70">
          <div>Type "/" for commands</div>
          <button
            type="button"
            className="flex items-center hover:text-electric-cyan"
          >
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Voice Input
          </button>
        </div>
      </form>
      
      {/* Thoughtlets */}
      {thoughtlets.map((thoughtlet) => (
        <div
          key={thoughtlet.id}
          className={`absolute ${
            thoughtlet.position === 'top' ? 'top-20 left-1/2 transform -translate-x-1/2' : 
            thoughtlet.position === 'right' ? 'right-96 top-1/2 transform -translate-y-1/2' : 
            thoughtlet.position === 'bottom' ? 'bottom-20 left-1/2 transform -translate-x-1/2' : 
            'left-20 top-1/2 transform -translate-y-1/2'
          } bg-midnight-navy text-cloud-white p-2 rounded-lg shadow-lg max-w-xs text-sm`}
        >
          {thoughtlet.content}
          <button 
            className="absolute top-1 right-1 text-cloud-white opacity-50 hover:opacity-100"
            onClick={() => setThoughtlets(thoughtlets.filter(t => t.id !== thoughtlet.id))}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default ForecastInsightAssistant;