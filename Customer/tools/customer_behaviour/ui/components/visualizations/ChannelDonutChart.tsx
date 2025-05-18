import React from 'react';
import Plot from 'react-plotly.js';
import { ChannelUsage } from '../../types';

interface ChannelDonutChartProps {
  channels: ChannelUsage[];
  highlights?: { channel?: string };
  width?: number;
  height?: number;
}

const channelColors: Record<string, string> = {
  Online: '#00e0ff',
  'In-store': '#5fd4d6',
  Phone: '#3e7b97',
  'Mobile app': '#aa45dd',
  Other: '#e930ff',
};

const ChannelDonutChart: React.FC<ChannelDonutChartProps> = ({ channels, highlights, width = 400, height = 400 }) => {
  const labels = channels.map(c => c.channel);
  const values = channels.map(c => c.count);
  const colors = channels.map(c => highlights?.channel === c.channel ? '#e930ff' : (channelColors[c.channel] || '#00e0ff'));
  return (
    <Plot
      data={[{
        type: 'pie',
        labels,
        values,
        hole: 0.6,
        marker: { colors },
        textinfo: 'label+percent',
        hoverinfo: 'label+value+percent',
        sort: false,
      }]}
      layout={{
        width,
        height,
        title: 'Channel Usage Distribution',
        paper_bgcolor: '#232a36',
        plot_bgcolor: '#232a36',
        font: { family: 'inherit', color: '#f7f9fb' },
        margin: { t: 40, l: 20, r: 20, b: 20 },
        showlegend: true,
      }}
      config={{ responsive: true, displayModeBar: false }}
    />
  );
};

export default ChannelDonutChart; 