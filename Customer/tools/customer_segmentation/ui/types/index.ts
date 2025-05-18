export interface Customer {
  customer_id: string;
  customer_type: string;
  status: string;
  region: string;
  industry: string;
  transaction_count: number;
  avg_order_value: number;
  total_spend: number;
  last_purchase_date: string;
  credit_limit: number;
  recency: number;
  segment: string | number;
}

export interface SegmentSummary {
  segment: string | number;
  count: number;
  avg_order_value: number;
  avg_recency: number;
  avg_total_spend: number;
  customer_types: string[];
  regions: string[];
}

export interface KPI {
  totalSegments: number;
  largestSegment: SegmentSummary;
  mostValuableSegment: SegmentSummary;
  avgSegmentSize: number;
}

export interface ScatterDatum {
  x: number;
  y: number;
  z: number;
  segment: string | number;
  customer_id: string;
} 