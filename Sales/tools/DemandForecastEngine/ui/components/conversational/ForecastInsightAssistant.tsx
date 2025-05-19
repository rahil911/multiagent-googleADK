import React, { useState, useEffect, useRef } from 'react';
import { ForecastHorizon, ForecastMetric, DimensionFilter } from '../../types';
import { useTheme } from '../../../../../../ui-common/design-system/theme';
import ChartWrapper from '../common/ChartWrapper';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

interface ForecastInsightAssistantProps {
  horizon: ForecastHorizon;
  metric: ForecastMetric;
  filters: DimensionFilter;
  onClose: () => void;
}

const ForecastInsightAssistant: React.FC<ForecastInsightAssistantProps> = ({
  horizon,
  metric,
  filters,
  onClose
}) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial welcome message
  useEffect(() => {
    const initialMessages: Message[] = [
      {
        id: '1',
        text: 'Hello! I can help you interpret your forecast data and answer questions. What would you like to know about your demand forecast?',
        sender: 'assistant',
        timestamp: new Date()
      }
    ];
    setMessages(initialMessages);
  }, []);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Send message to assistant
  const sendMessage = () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    // Simulate AI response with predefined answers based on input
    setTimeout(() => {
      const responseText = generateResponse(input, horizon, metric);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 1000);
  };

  // Generate a response based on the user input and current parameters
  const generateResponse = (input: string, horizon: ForecastHorizon, metric: ForecastMetric): string => {
    const query = input.toLowerCase();
    
    if (query.includes('peak') || query.includes('seasonal')) {
      return `Based on the data, your peak ${metric} typically occurs in Q4 (October-December). There's a strong seasonal pattern with an amplitude of 1.4x between peak and low seasons.`;
    }
    
    if (query.includes('accuracy') || query.includes('error')) {
      return `The current forecast model has a Mean Absolute Percentage Error (MAPE) of 8.3% for the ${horizon} horizon. This is within industry standards for ${metric} forecasting. We could potentially improve accuracy by incorporating more external factors.`;
    }
    
    if (query.includes('growth') || query.includes('trend')) {
      return `The overall trend shows a ${metric === 'revenue' ? '7.2% annual growth in revenue' : '5.4% annual growth in unit sales'}. This is slightly ${metric === 'revenue' ? 'above' : 'below'} the industry average of 6.5%.`;
    }
    
    if (query.includes('compare') || query.includes('scenario')) {
      return `Comparing the baseline scenario with the growth scenario, you could see up to 15% higher ${metric} in the next ${horizon} if the optimistic conditions materialize. The recession scenario projects a ${metric} decrease of approximately 10%.`;
    }
    
    if (query.includes('recommend') || query.includes('suggest')) {
      return `Based on the current forecast, I'd recommend preparing for the seasonal peak in Q4. Consider increasing inventory by at least 20% above baseline to meet the projected demand increase.`;
    }
    
    if (query.includes('model') || query.includes('algorithm')) {
      return `The current forecast is using an ARIMA model with seasonality components. It's performing 12% better than a simple moving average approach for your data patterns.`;
    }
    
    // Default response
    return `I'd be happy to help with your question about ${metric} forecasts for the ${horizon} horizon. Could you please be more specific about what aspect of the forecast you'd like insights on?`;
  };

  return (
    <ChartWrapper title="Forecast Insights" height="100%">
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${theme.spacing[3]}px`,
          borderBottom: `1px solid ${theme.colors.graphiteDark}`
        }}>
          <div style={{ 
            fontSize: theme.typography.fontSize.md,
            fontWeight: theme.typography.fontWeight.semiBold,
            color: theme.colors.cloudWhite
          }}>
            AI Insights Assistant
          </div>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: theme.colors.cloudWhite,
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            ×
          </button>
        </div>
        
        {/* Message area */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: `${theme.spacing[3]}px`,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {messages.map(message => (
            <div 
              key={message.id}
              style={{
                maxWidth: '85%',
                alignSelf: message.sender === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.sender === 'user' 
                  ? theme.colors.electricCyan 
                  : theme.colors.midnight,
                color: message.sender === 'user'
                  ? theme.colors.midnight
                  : theme.colors.cloudWhite,
                padding: `${theme.spacing[3]}px`,
                borderRadius: '12px',
                borderBottomRightRadius: message.sender === 'user' ? '0' : '12px',
                borderBottomLeftRadius: message.sender === 'user' ? '12px' : '0',
              }}
            >
              {message.text}
              <div style={{ 
                fontSize: theme.typography.fontSize.xs,
                color: message.sender === 'user' 
                  ? 'rgba(0, 0, 0, 0.5)' 
                  : 'rgba(255, 255, 255, 0.5)',
                marginTop: '4px',
                textAlign: 'right'
              }}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={{
              alignSelf: 'flex-start',
              backgroundColor: theme.colors.midnight,
              color: theme.colors.cloudWhite,
              padding: `${theme.spacing[3]}px`,
              borderRadius: '12px',
              borderBottomLeftRadius: '0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <div style={{ 
                display: 'flex',
                gap: '4px'
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.electricCyan,
                  animation: 'pulse 1s infinite',
                  animationDelay: '0s'
                }}></span>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.electricCyan,
                  animation: 'pulse 1s infinite',
                  animationDelay: '0.2s'
                }}></span>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: theme.colors.electricCyan,
                  animation: 'pulse 1s infinite',
                  animationDelay: '0.4s'
                }}></span>
              </div>
              <style jsx global>{`
                @keyframes pulse {
                  0% { opacity: .4; }
                  50% { opacity: 1; }
                  100% { opacity: .4; }
                }
              `}</style>
              Thinking...
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Input area */}
        <div style={{
          padding: `${theme.spacing[3]}px`,
          borderTop: `1px solid ${theme.colors.graphiteDark}`,
          display: 'flex',
          gap: '8px'
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about your forecast data..."
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '24px',
              border: 'none',
              backgroundColor: theme.colors.graphite,
              color: theme.colors.cloudWhite,
              fontSize: theme.typography.fontSize.sm
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              backgroundColor: theme.colors.electricCyan,
              color: theme.colors.midnight,
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            →
          </button>
        </div>
      </div>
    </ChartWrapper>
  );
};

export default ForecastInsightAssistant;