import { FunctionDeclaration } from 'ui-common/utils/api/types';

export const customerSegmentationFunctions: FunctionDeclaration[] = [
  {
    name: 'highlightSegment',
    description: 'Highlight a specific customer segment on all visualizations',
    parameters: {
      type: 'object',
      properties: {
        segment: { type: 'string', description: 'Segment identifier' },
        explanation: { type: 'string', description: 'Reason for highlighting' }
      },
      required: ['segment']
    }
  },
  {
    name: 'filterByRegion',
    description: 'Filter customer segments by region',
    parameters: {
      type: 'object',
      properties: {
        region: { type: 'string', description: 'Region name' }
      },
      required: ['region']
    }
  },
  {
    name: 'compareSegments',
    description: 'Compare two or more customer segments across KPIs',
    parameters: {
      type: 'object',
      properties: {
        segments: { type: 'array', items: { type: 'string' }, description: 'List of segment identifiers' },
        label: { type: 'string', description: 'Label for the comparison' }
      },
      required: ['segments']
    }
  },
  {
    name: 'explainSegment',
    description: 'Generate an explanation for a customer segment',
    parameters: {
      type: 'object',
      properties: {
        segment: { type: 'string', description: 'Segment identifier' },
        dataPoint: { type: 'string', description: 'Specific data point to explain', nullable: true }
      },
      required: ['segment']
    }
  },
  {
    name: 'resetSegmentationView',
    description: 'Reset all filters and highlights on the segmentation dashboard',
    parameters: {
      type: 'object',
      properties: {},
      required: []
    }
  }
]; 