// Type definitions for Purchase Frequency Analyzer

export interface PurchaseData {
  customer_id: string;
  total_purchases: number;
  avg_interval_days: number;
  first_purchase: string;
  last_purchase: string;
  total_spent: number;
  avg_transaction: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FrequencySegment {
  name: string;
  count: number;
  percentage: number;
  threshold: number;
}

export interface KPIData {
  total_customers: number;
  avg_purchase_frequency: number;
  avg_interval_days: number;
  active_customers_percentage: number;
  high_value_customers_percentage: number;
  previous_period_comparison?: {
    total_customers: number;
    avg_purchase_frequency: number;
    avg_interval_days: number;
    active_customers_percentage: number;
    high_value_customers_percentage?: number;
  };
}

export interface KPITileProps {
  title: string;
  value: number | string;
  previousValue?: number | string;
  format?: 'number' | 'percentage' | 'currency' | 'days' | 'decimal';
  trend?: number | 'up' | 'down' | 'neutral';
  isCritical?: boolean;
  showSpark?: boolean;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export interface HighlightedElements {
  histogramBins: number[];
  intervalCells: Array<{day: string; hour: number}>;
  customerSegments: string[];
  valueSegments: string[];
  regularityAxes: string[];
}

export interface HistogramData {
  frequency: number;
  count: number;
  percentage: number;
  segmentType?: 'high' | 'medium' | 'low';
}

export interface FrequencyHistogramProps {
  data: HistogramData[];
  meanFrequency: number;
  highThreshold: number;
  lowThreshold: number;
  width?: number;
  height?: number;
  colorScale?: string[];
  onBarClick?: (frequency: number) => void;
  highlightBins?: number[];
  focusRegion?: {start: number; end: number};
}

export interface IntervalData {
  day: string;
  hour: number;
  volume: number;
  avg_value: number;
  value: number;
}

export interface IntervalHeatmapProps {
  data: IntervalData[];
  dateRange: DateRange;
  width?: number;
  height?: number;
  colorScale?: string[];
  onCellClick?: (day: string, hour: number) => void;
  onDateRangeChange?: (newRange: DateRange) => void;
  highlightCells?: Array<{day: string; hour: number}>;
  focusRegion?: {
    startDay: string;
    endDay: string;
    startHour: number;
    endHour: number;
  };
}

export interface CustomerSegment {
  segment: string;
  frequency: number;
  recency: number;
  count: number;
  percentage: number;
  avg_value: number;
}

export interface SegmentQuadrantProps {
  data: CustomerSegment[];
  width?: number;
  height?: number;
  onSegmentClick?: (segment: string) => void;
  onCustomerClick?: (customerId: string) => void;
  highlightSegments?: string[];
  focusRegion?: {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  };
}

export interface RegularityData {
  timeframe: string;
  regularity_score: number;
  description: string;
}

export interface RegularityChartProps {
  data: RegularityData[];
  previousPeriodData?: RegularityData[];
  width?: number;
  height?: number;
  showComparison?: boolean;
  onAxisClick?: (timeframe: string) => void;
}

export interface ValueSegment {
  segment: string;
  count: number;
  percentage: number;
  avgValue: number;
}

export interface ValueTreemapProps {
  data: ValueSegment[];
  width?: number;
  height?: number;
  onSegmentClick?: (segment: string) => void;
  highlightSegments?: string[];
}

export interface DateRangePickerProps {
  dateRange: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Array<{
    label: string;
    range: DateRange;
  }>;
  isLoading?: boolean;
}

export interface FilterControlProps {
  segments: string[];
  selectedSegments: string[];
  onChange: (segments: string[]) => void;
  isLoading?: boolean;
}

export interface PatternIntelligenceProps {
  isExpanded: boolean;
  onToggle: () => void;
  onQuery: (query: string) => void;
  response?: string;
  isLoading?: boolean;
  suggestedQueries?: string[];
}

export interface RecommendationCard {
  id: string;
  title: string;
  description: string;
  actionText: string;
  category: 'frequency' | 'value' | 'retention';
  priority: number;
}

// Function declaration type for LLM control
export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: {
      [key: string]: {
        type: string;
        description: string;
        enum?: string[];
        items?: {
          type: string;
        };
      }
    };
    required?: string[];
  };
} 