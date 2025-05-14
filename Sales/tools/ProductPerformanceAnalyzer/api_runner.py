#!/usr/bin/env python
"""
API Runner for ProductPerformanceAnalyzer

This script acts as a bridge between the Next.js API route and the ProductPerformanceAnalyzer class.
It parses command line arguments, runs the analyzer, and returns the result as JSON to stdout.
"""

import sys
import os
import json
import argparse
from typing import List, Optional

# Add the project root to the Python path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
sys.path.insert(0, project_root)

from Sales.tools.ProductPerformanceAnalyzer.ProductPerformanceAnalyzer import ProductPerformanceAnalyzer

def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Run the Product Performance Analyzer')
    
    # Required arguments
    parser.add_argument('--start_date', type=str, required=True, help='Start date in YYYY-MM-DD format')
    parser.add_argument('--end_date', type=str, required=True, help='End date in YYYY-MM-DD format')
    parser.add_argument('--metrics', type=str, required=True, help='Comma-separated list of metrics to analyze')
    
    # Optional arguments
    parser.add_argument('--category_level', type=str, default='product', 
                       choices=['product', 'category', 'subcategory'],
                       help='Level of product categorization')
    parser.add_argument('--min_sales_threshold', type=float, default=None,
                       help='Minimum sales amount to include in analysis')
    
    return parser.parse_args()

def run_analyzer(args: argparse.Namespace) -> dict:
    """Run the Product Performance Analyzer with the given arguments."""
    try:
        # Parse metrics
        metrics = args.metrics.split(',')
        
        # Validate metrics
        valid_metrics = ['sales', 'units', 'margin', 'price_bands']
        for metric in metrics:
            if metric not in valid_metrics:
                return {
                    "status": "error",
                    "message": f"Invalid metric: {metric}. Valid metrics are: {', '.join(valid_metrics)}"
                }
        
        # Initialize the analyzer
        analyzer = ProductPerformanceAnalyzer(
            metrics=metrics,
            category_level=args.category_level,
            min_sales_threshold=args.min_sales_threshold,
            include_visualization=False  # No visualizations for API calls
        )
        
        # Run the analysis
        result = analyzer.analyze_performance(
            start_date=args.start_date,
            end_date=args.end_date
        )
        
        return result
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

def main() -> None:
    """Main entry point."""
    args = parse_args()
    result = run_analyzer(args)
    
    # Output result as JSON to stdout
    print(json.dumps(result))

if __name__ == "__main__":
    main() 