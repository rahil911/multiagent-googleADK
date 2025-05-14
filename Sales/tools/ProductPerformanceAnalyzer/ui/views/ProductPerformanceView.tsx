import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../../../../../ui-common/utils/state/store';
import { Card } from '../../../../../ui-common/design-system/components/Card';
import { Grid } from '../../../../../ui-common/design-system/components/Grid';
import { useTheme } from '../../../../../ui-common/design-system/theme';

// Import components
import { KpiTileRow } from '../components/kpi/KpiTileRow';
import { SalesPerformanceExplorer } from '../components/visualizations/SalesPerformanceExplorer';
import { MarginAnalysisVisualizer } from '../components/visualizations/MarginAnalysisVisualizer';
import { PriceBandDistribution } from '../components/visualizations/PriceBandDistribution';
import { ProductGrowthMatrix } from '../components/visualizations/ProductGrowthMatrix';
import { FilterControls } from '../components/controls/FilterControls';
import { MetricSelector } from '../components/controls/MetricSelector';
import { ProductInsightAssistant } from '../components/ai-interaction/ProductInsightAssistant';

// Import state and actions
import {
  fetchProductPerformance,
  setDateRange,
  setSelectedCategory,
  setSelectedSubcategory,
  setMinSalesThreshold,
  setSelectedMetrics,
  resetFilters,
} from '../state/productPerformanceSlice';

// Import types
import { Product, ProductKpiData } from '../types';

/**
 * Main Product Performance Dashboard View
 * Integrates all components into a unified dashboard experience
 */
export const ProductPerformanceView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const theme = useTheme();
  
  // Get data from Redux store
  const {
    loading,
    data,
    analysisResult,
    dateRange,
    selectedCategory,
    selectedSubcategory,
    minSalesThreshold,
    selectedMetrics,
  } = useSelector((state: any) => state.productPerformance);
  
  // Local state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showAiAssistant, setShowAiAssistant] = useState(true);
  
  // Mock KPI data - in a real implementation this would come from the analysis result
  const kpiData: ProductKpiData = {
    totalSales: {
      value: analysisResult?.results?.sales?.total_sales || 0,
      trend: 5.2,
      direction: "up-good",
    },
    averageMargin: {
      value: analysisResult?.results?.margin?.average_margin_pct || 0,
      trend: -1.3,
      direction: "down-bad",
    },
    topCategory: {
      value: Object.entries(analysisResult?.results?.sales?.category_distribution || {})
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "",
      percentage: Object.entries(analysisResult?.results?.sales?.category_distribution || {})
        .sort((a, b) => b[1] - a[1])[0]?.[1] || 0,
    },
    priceDistribution: {
      dominant: Object.entries(analysisResult?.results?.price_bands?.distribution || {})
        .sort((a, b) => b[1].count - a[1].count)[0]?.[0] || "",
      percentage: Object.entries(analysisResult?.results?.price_bands?.distribution || {})
        .sort((a, b) => b[1].count - a[1].count)[0]?.[1]?.count / 
        Object.values(analysisResult?.results?.price_bands?.distribution || {})
          .reduce((sum, band) => sum + band.count, 0) * 100 || 0,
    },
    totalUnits: {
      value: analysisResult?.results?.units?.total_units || 0,
      trend: 3.1,
      direction: "up-good",
    },
  };
  
  // Fetch data on mount and when filters change
  useEffect(() => {
    dispatch(fetchProductPerformance());
  }, [dispatch, dateRange, selectedCategory, selectedSubcategory, minSalesThreshold, selectedMetrics]);
  
  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
  };
  
  // Handle filter changes
  const handleDateRangeChange = (startDate: string, endDate: string) => {
    dispatch(setDateRange({ startDate, endDate }));
  };
  
  const handleCategoryChange = (category: string | null) => {
    dispatch(setSelectedCategory(category));
  };
  
  const handleSubcategoryChange = (subcategory: string | null) => {
    dispatch(setSelectedSubcategory(subcategory));
  };
  
  const handleThresholdChange = (threshold: number | null) => {
    dispatch(setMinSalesThreshold(threshold));
  };
  
  const handleMetricsChange = (metrics: ("sales" | "units" | "margin" | "price_bands")[]) => {
    dispatch(setSelectedMetrics(metrics));
  };
  
  const handleResetFilters = () => {
    dispatch(resetFilters());
  };
  
  return (
    <div style={{ 
      background: theme.colors.midnight, 
      color: theme.colors.cloudWhite,
      minHeight: '100vh',
      padding: theme.spacing[4]
    }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 700, 
        marginBottom: theme.spacing[4],
        color: theme.colors.cloudWhite
      }}>
        Product Performance Analyzer
      </h1>
      
      {/* Filter Row */}
      <Card elevation="sm" style={{ marginBottom: theme.spacing[4] }}>
        <FilterControls
          dateRange={dateRange}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          minSalesThreshold={minSalesThreshold}
          onDateRangeChange={handleDateRangeChange}
          onCategoryChange={handleCategoryChange}
          onSubcategoryChange={handleSubcategoryChange}
          onThresholdChange={handleThresholdChange}
          onResetFilters={handleResetFilters}
        />
      </Card>
      
      {/* KPI Row */}
      <KpiTileRow 
        data={kpiData} 
        loading={loading} 
        style={{ marginBottom: theme.spacing[4] }}
      />
      
      {/* Main Dashboard Grid */}
      <Grid
        container
        spacing={theme.spacing[4]}
        style={{ marginBottom: theme.spacing[4] }}
      >
        {/* Left Column (sales, price bands) */}
        <Grid item xs={12} lg={6}>
          <SalesPerformanceExplorer
            data={data}
            loading={loading}
            onProductSelect={handleProductSelect}
            height={480}
            style={{ marginBottom: theme.spacing[4] }}
          />
          
          <PriceBandDistribution
            data={data}
            loading={loading}
            priceBandData={analysisResult?.results?.price_bands}
            height={460}
          />
        </Grid>
        
        {/* Right Column (margin, growth matrix) */}
        <Grid item xs={12} lg={6}>
          <MarginAnalysisVisualizer
            data={data}
            loading={loading}
            height={440}
            style={{ marginBottom: theme.spacing[4] }}
          />
          
          <ProductGrowthMatrix
            data={data}
            loading={loading}
            height={560}
          />
        </Grid>
      </Grid>
      
      {/* AI Assistant */}
      {showAiAssistant && (
        <div style={{ 
          position: 'fixed', 
          right: 0, 
          top: '20%', 
          bottom: '20%',
          width: '360px',
          zIndex: 1000,
        }}>
          <ProductInsightAssistant
            selectedProduct={selectedProduct}
            onClose={() => setShowAiAssistant(false)}
          />
        </div>
      )}
      
      {/* AI Assistant Toggle */}
      {!showAiAssistant && (
        <button
          onClick={() => setShowAiAssistant(true)}
          style={{
            position: 'fixed',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            background: theme.colors.electricCyan,
            border: 'none',
            borderRadius: '4px 0 0 4px',
            padding: theme.spacing[2],
            color: theme.colors.midnight,
            cursor: 'pointer',
            zIndex: 1000,
          }}
        >
          <span>AI Insights</span>
        </button>
      )}
    </div>
  );
};

export default ProductPerformanceView; 