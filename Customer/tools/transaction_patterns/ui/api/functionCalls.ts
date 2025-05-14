import { FunctionDeclaration } from '../../../../../ui-common/utils/api/types';

// Define function declarations for Transaction Patterns tool
// Note: Implementation will be added in a later phase
export const transactionPatternFunctions: FunctionDeclaration[] = [
  {
    name: "showTransactionAnomaly",
    description: "Points to and explains an anomalous transaction",
    parameters: {
      type: "object",
      properties: {
        chartId: {
          type: "string",
          description: "ID of the chart containing the anomaly"
        },
        datasetIndex: {
          type: "integer",
          description: "Index of the dataset within the chart"
        },
        elementIndex: {
          type: "integer",
          description: "Index of the specific anomalous data point"
        },
        explanation: {
          type: "string",
          description: "Natural language explanation of the anomaly"
        },
        sentiment: {
          type: "string",
          enum: ["good", "bad", "neutral"],
          description: "Whether this is a positive or negative anomaly"
        }
      },
      required: ["chartId", "datasetIndex", "elementIndex", "explanation"]
    }
  },
  {
    name: "highlightTemporalPattern",
    description: "Highlights a specific temporal pattern in transaction data",
    parameters: {
      type: "object",
      properties: {
        patternType: {
          type: "string",
          enum: ["hourly", "daily", "weekly", "monthly"],
          description: "The type of temporal pattern to highlight"
        },
        value: {
          type: "string",
          description: "The specific value to highlight (e.g., '14' for 2pm hour, 'Monday' for day)"
        },
        explanation: {
          type: "string",
          description: "Explanation of the pattern's significance"
        }
      },
      required: ["patternType", "value", "explanation"]
    }
  },
  {
    name: "explainProductAssociation",
    description: "Explains a product association rule",
    parameters: {
      type: "object",
      properties: {
        products: {
          type: "array",
          items: {
            type: "string"
          },
          description: "The products in the association rule"
        },
        direction: {
          type: "string",
          enum: ["antecedent", "consequent", "bidirectional"],
          description: "The direction of the association rule"
        },
        strength: {
          type: "number",
          description: "The lift value indicating strength of association"
        },
        explanation: {
          type: "string",
          description: "Natural language explanation of the association"
        }
      },
      required: ["products", "direction", "strength", "explanation"]
    }
  },
  {
    name: "filterTransactionsByTime",
    description: "Filters transactions by specified time period",
    parameters: {
      type: "object",
      properties: {
        timeUnit: {
          type: "string",
          enum: ["hour", "day", "weekday", "weekend", "month"],
          description: "The time unit to filter by"
        },
        value: {
          type: "string",
          description: "The specific value to filter on (e.g., '14' for 2pm, 'Monday')"
        }
      },
      required: ["timeUnit", "value"]
    }
  },
  {
    name: "compareTimePeriods",
    description: "Compares transaction patterns between two time periods",
    parameters: {
      type: "object",
      properties: {
        period1: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end: { type: "string", description: "End date in YYYY-MM-DD format" },
            label: { type: "string", description: "Label for this period" }
          },
          required: ["start", "end", "label"]
        },
        period2: {
          type: "object",
          properties: {
            start: { type: "string", description: "Start date in YYYY-MM-DD format" },
            end: { type: "string", description: "End date in YYYY-MM-DD format" },
            label: { type: "string", description: "Label for this period" }
          },
          required: ["start", "end", "label"]
        },
        metric: {
          type: "string",
          enum: ["transaction_count", "average_value", "anomaly_rate", "payment_method_distribution"],
          description: "The metric to compare between periods"
        }
      },
      required: ["period1", "period2", "metric"]
    }
  }
];

export default transactionPatternFunctions; 