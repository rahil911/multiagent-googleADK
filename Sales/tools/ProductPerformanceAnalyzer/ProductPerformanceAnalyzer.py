"""
Product Performance Analyzer tool for analyzing product-specific metrics and performance indicators.
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import io
import base64
import os 
import sys

# Make sure our project root is in the path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..'))
sys.path.insert(0, project_root)

from Sales.database.connection import get_connection
from Sales.database.query_templates import get_latest_date
from Sales.database import config

# Configure logging
logging.basicConfig(level=config.LOGGING['level'])
logger = logging.getLogger(__name__)

class ProductPerformanceAnalyzer:
    """
    Analyzes product performance metrics including sales, margins, inventory turns,
    and product mix analysis.
    """
    
    VALID_METRICS = ['sales', 'units', 'margin', 'price_bands']
    VALID_CATEGORY_LEVELS = ['product', 'category', 'subcategory']
    
    def __init__(self, 
                 metrics: List[str] = ['sales', 'units', 'margin'],
                 category_level: str = 'product',
                 min_sales_threshold: Optional[float] = None,
                 include_visualization: bool = True,
                 db_path: Optional[str] = None):
        """
        Initialize the ProductPerformanceAnalyzer.
        
        Args:
            metrics: List of metrics to analyze
            category_level: Level of product categorization ('product', 'category', 'subcategory')
            min_sales_threshold: Minimum sales amount to include in analysis
            include_visualization: Whether to include visualizations in results
            db_path: Optional path to the database file
        """
        # Validate inputs
        if not all(metric in self.VALID_METRICS for metric in metrics):
            raise ValueError(f"Invalid metrics. Must be one of {self.VALID_METRICS}")
        if category_level not in self.VALID_CATEGORY_LEVELS:
            raise ValueError(f"Invalid category level. Must be one of {self.VALID_CATEGORY_LEVELS}")
            
        self.metrics = metrics
        self.category_level = category_level
        self.min_sales_threshold = min_sales_threshold
        self.include_visualization = include_visualization
        self.db_path = db_path or config.DATABASE['path']
        
        logger.info(f"Initialized ProductPerformanceAnalyzer with metrics={metrics}, category_level={category_level}")
    
    def analyze_performance(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze product performance for the specified date range.
        
        Args:
            start_date: Optional start date in YYYY-MM-DD format. If None, uses earliest available date.
            end_date: Optional end date in YYYY-MM-DD format. If None, uses latest available date.
            
        Returns:
            Dictionary containing analysis results
        """
        try:
            # Get database connection
            conn, wrapper = get_connection()
            
            # Get latest date if end_date not provided
            if not end_date:
                end_date = get_latest_date(conn)
            
            # If start_date not provided, use last 30 days
            if not start_date:
                start_date = (datetime.strptime(end_date, "%Y-%m-%d") - timedelta(days=30)).strftime("%Y-%m-%d")
            
            # Build query
            query = self._build_query()
            
            # Execute query
            results = wrapper.fetchall(query, (start_date, end_date))
            
            if not results:
                return {
                    "status": "error",
                    "message": "No data found for the specified period"
                }
            
            # Convert to DataFrame
            columns = ['product_id', 'product_name', 'category', 'subcategory', 
                      'sales_amount', 'quantity', 'cost']
            data = pd.DataFrame(results, columns=columns)
            
            # Apply minimum sales threshold if specified
            if self.min_sales_threshold:
                data = data[data['sales_amount'] >= self.min_sales_threshold]
            
            # Calculate metrics
            analysis_results = {}
            
            if 'sales' in self.metrics:
                analysis_results['sales'] = self._analyze_sales(data)
            
            if 'units' in self.metrics:
                analysis_results['units'] = self._analyze_units(data)
            
            if 'margin' in self.metrics:
                analysis_results['margin'] = self._analyze_margins(data)
            
            if 'price_bands' in self.metrics:
                analysis_results['price_bands'] = self._analyze_price_bands(data)
            
            # Add visualization if requested
            if self.include_visualization:
                self._create_visualization(data)
            
            # Close connections
            conn.close()
            wrapper.close()
            
            return {
                "status": "success",
                "period": {"start": start_date, "end": end_date},
                "results": analysis_results
            }
            
        except Exception as e:
            logger.error(f"Error analyzing product performance: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    def _build_query(self) -> str:
        """
        Build the SQL query for product performance analysis.
        
        Returns:
            SQL query string
        """
        query = """
            SELECT 
                i."Item Key" as product_id,
                i."Item Desc" as product_name,
                i."Item Category Desc" as category,
                i."Item Subcategory Desc" as subcategory,
                SUM(t."Net Sales Amount") as sales_amount,
                SUM(t."Net Sales Quantity") as quantity,
                SUM(t."Net Sales Amount") as cost  -- Using sales amount as placeholder since cost data is not available
            FROM "dbo_F_Sales_Transaction" t
            LEFT JOIN "dbo_D_Item" i ON t."Item Key" = i."Item Key"
            WHERE t."Txn Date" BETWEEN ? AND ?
                AND t."Deleted Flag" = 0
                AND t."Excluded Flag" = 0
        """
        
        # Add grouping based on category level
        if self.category_level == 'product':
            query += """
                GROUP BY i."Item Key", i."Item Desc", i."Item Category Desc", i."Item Subcategory Desc"
                ORDER BY sales_amount DESC
            """
        elif self.category_level == 'category':
            query += """
                GROUP BY i."Item Category Desc"
                ORDER BY sales_amount DESC
            """
        else:  # subcategory
            query += """
                GROUP BY i."Item Subcategory Desc"
                ORDER BY sales_amount DESC
            """
        
        return query
    
    def _analyze_sales(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze sales performance metrics.
        
        Args:
            data: DataFrame containing product data
            
        Returns:
            Dictionary containing sales analysis
        """
        try:
            # Calculate sales metrics
            total_sales = data['sales_amount'].sum()
            avg_sales = data['sales_amount'].mean()
            
            # Get top products by sales
            top_products = data.nlargest(10, 'sales_amount')[
                ['product_name', 'sales_amount']
            ].to_dict('records')
            
            # Calculate sales distribution by category
            category_sales = data.groupby('category')['sales_amount'].sum()
            category_distribution = (category_sales / total_sales * 100).to_dict()
            
            return {
                "total_sales": total_sales,
                "average_sales": avg_sales,
                "top_products": top_products,
                "category_distribution": category_distribution
            }
            
        except Exception as e:
            logger.error(f"Error analyzing sales: {str(e)}")
            raise
    
    def _analyze_units(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze unit sales metrics.
        
        Args:
            data: DataFrame containing product data
            
        Returns:
            Dictionary containing unit sales analysis
        """
        try:
            # Calculate unit metrics
            total_units = data['quantity'].sum()
            avg_units = data['quantity'].mean()
            
            # Get top products by units
            top_products = data.nlargest(10, 'quantity')[
                ['product_name', 'quantity']
            ].to_dict('records')
            
            # Calculate unit distribution by category
            category_units = data.groupby('category')['quantity'].sum()
            category_distribution = (category_units / total_units * 100).to_dict()
            
            return {
                "total_units": total_units,
                "average_units": avg_units,
                "top_products": top_products,
                "category_distribution": category_distribution
            }
            
        except Exception as e:
            logger.error(f"Error analyzing units: {str(e)}")
            raise
    
    def _analyze_margins(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze margin metrics.
        
        Args:
            data: DataFrame containing product data
            
        Returns:
            Dictionary containing margin analysis
        """
        try:
            # Calculate margins
            data['margin'] = data['sales_amount'] - data['cost']
            data['margin_pct'] = (data['margin'] / data['sales_amount']) * 100
            
            # Calculate margin metrics
            total_margin = data['margin'].sum()
            avg_margin_pct = data['margin_pct'].mean()
            
            # Get top products by margin
            top_products = data.nlargest(10, 'margin')[
                ['product_name', 'margin', 'margin_pct']
            ].to_dict('records')
            
            # Calculate margin distribution by category
            category_margins = data.groupby('category')['margin'].sum()
            category_distribution = (category_margins / total_margin * 100).to_dict()
            
            return {
                "total_margin": total_margin,
                "average_margin_pct": avg_margin_pct,
                "top_products": top_products,
                "category_distribution": category_distribution
            }
            
        except Exception as e:
            logger.error(f"Error analyzing margins: {str(e)}")
            raise
    
    def _analyze_price_bands(self, data: pd.DataFrame) -> Dict[str, Any]:
        """
        Analyze product price bands.
        
        Args:
            data: DataFrame containing product data
            
        Returns:
            Dictionary containing price band analysis
        """
        try:
            # Calculate average price per unit and handle missing values
            data['avg_price'] = data['sales_amount'] / data['quantity'].replace(0, np.nan)
            data = data.dropna(subset=['avg_price'])
            
            if data.empty:
                return {
                    "price_bands": [],
                    "distribution": {}
                }
            
            # Define price bands
            price_bands = [
                (0, 10),
                (10, 20),
                (20, 50),
                (50, 100),
                (100, float('inf'))
            ]
            
            # Calculate distribution
            distribution = {}
            for lower, upper in price_bands:
                if upper == float('inf'):
                    mask = data['avg_price'] >= lower
                else:
                    mask = (data['avg_price'] >= lower) & (data['avg_price'] < upper)
                
                band_data = data[mask]
                if not band_data.empty:
                    distribution[f"${lower}-{upper if upper != float('inf') else '∞'}"] = {
                        'count': len(band_data),
                        'total_sales': band_data['sales_amount'].sum(),
                        'avg_price': band_data['avg_price'].mean()
                    }
            
            return {
                "price_bands": [f"${lower}-{upper if upper != float('inf') else '∞'}" 
                              for lower, upper in price_bands],
                "distribution": distribution
            }
            
        except Exception as e:
            logger.error(f"Error analyzing price bands: {str(e)}")
            return {
                "price_bands": [],
                "distribution": {}
            }
    
    def _create_visualization(self, data: pd.DataFrame) -> None:
        """
        Create visualization of product performance metrics.
        
        Args:
            data: DataFrame containing product data
            
        Returns:
            None (prints Base64 URL instead)
        """
        try:
            # Create a figure with multiple subplots
            fig = plt.figure(figsize=(15, 10))
            
            # 1. Sales by Category (Top Left)
            ax1 = plt.subplot2grid((2, 2), (0, 0))
            category_sales = data.groupby('category')['sales_amount'].sum()
            category_sales.plot(kind='bar', ax=ax1, color='blue', alpha=0.7)
            ax1.set_title('Sales by Category')
            ax1.set_xlabel('Category')
            ax1.set_ylabel('Sales Amount ($)')
            plt.xticks(rotation=45, ha='right')
            
            # 2. Top Products by Margin (Top Right)
            ax2 = plt.subplot2grid((2, 2), (0, 1))
            data['margin'] = data['sales_amount'] - data['cost']
            data['margin_pct'] = (data['margin'] / data['sales_amount']) * 100
            top_products = data.nlargest(5, 'margin_pct')
            
            bars = ax2.bar(top_products['product_name'], top_products['margin_pct'], color='green')
            ax2.set_title('Top Products by Margin %')
            ax2.set_xlabel('Product')
            ax2.set_ylabel('Margin %')
            plt.xticks(rotation=45, ha='right')
            
            # 3. Price Band Distribution (Bottom Left)
            ax3 = plt.subplot2grid((2, 2), (1, 0))
            data['avg_price'] = data['sales_amount'] / data['quantity']
            price_bands = pd.qcut(data['avg_price'], q=5, labels=['Very Low', 'Low', 'Medium', 'High', 'Very High'])
            price_dist = price_bands.value_counts()
            
            price_dist.plot(kind='pie', ax=ax3, autopct='%1.1f%%')
            ax3.set_title('Price Band Distribution')
            ax3.set_ylabel('')
            
            # 4. Sales vs Margin (Bottom Right)
            ax4 = plt.subplot2grid((2, 2), (1, 1))
            scatter = ax4.scatter(data['sales_amount'], data['margin_pct'], alpha=0.6)
            ax4.set_title('Sales vs Margin %')
            ax4.set_xlabel('Sales Amount ($)')
            ax4.set_ylabel('Margin %')
            
            # Add trend line
            z = np.polyfit(data['sales_amount'], data['margin_pct'], 1)
            p = np.poly1d(z)
            ax4.plot(data['sales_amount'], p(data['sales_amount']), "r--", alpha=0.3)
            
            # Adjust layout
            plt.tight_layout()
            
            # Save plot to buffer
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
            buffer.seek(0)
            
            # Convert to base64
            plot_data = base64.b64encode(buffer.read()).decode()
            
            # Close plot to free memory
            plt.close()
            
            # Print the Base64 URL instead of returning it
            print(f"data:image/png;base64,{plot_data}")
            
        except Exception as e:
            logger.error(f"Error creating visualization: {str(e)}")
            raise


if __name__ == "__main__":
    # Test the analyzer
    analyzer = ProductPerformanceAnalyzer(
        metrics=['sales', 'units', 'margin'],
        category_level='product',
        min_sales_threshold=1000,
        include_visualization=True
    )
    
    result = analyzer.analyze_performance()
    print(result)