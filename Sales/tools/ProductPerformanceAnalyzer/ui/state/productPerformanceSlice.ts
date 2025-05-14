import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { ProductPerformanceState, ProductAnalysisResult, Product } from '../types';
import { format } from 'date-fns';
import { productPerformanceApi } from '../api/productPerformanceApi';

// Initial state
const initialState: ProductPerformanceState = {
  loading: false,
  error: null,
  data: [],
  dateRange: {
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days ago
    endDate: format(new Date(), 'yyyy-MM-dd'), // Today
  },
  selectedCategory: null,
  selectedSubcategory: null,
  minSalesThreshold: 1000,
  selectedMetrics: ['sales', 'units', 'margin', 'price_bands'],
  categoryLevel: 'product',
  analysisResult: null,
};

// API call to fetch product performance data
export const fetchProductPerformance = createAsyncThunk(
  'productPerformance/fetchData',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { productPerformance: ProductPerformanceState };
    const { dateRange, selectedMetrics, categoryLevel, minSalesThreshold } = state.productPerformance;
    
    try {
      // Use the actual API client instead of direct fetch
      const data = await productPerformanceApi.fetchProductPerformance({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        metrics: selectedMetrics,
        category_level: categoryLevel,
        min_sales_threshold: minSalesThreshold,
      });
      
      if (data.status === 'error') {
        return rejectWithValue(data.message || 'Failed to fetch product performance data');
      }
      
      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Redux Slice
const productPerformanceSlice = createSlice({
  name: 'productPerformance',
  initialState,
  reducers: {
    setDateRange: (state, action: PayloadAction<{ startDate: string; endDate: string }>) => {
      state.dateRange = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string | null>) => {
      state.selectedCategory = action.payload;
      // Clear subcategory when category changes
      if (state.selectedSubcategory !== null) {
        state.selectedSubcategory = null;
      }
    },
    setSelectedSubcategory: (state, action: PayloadAction<string | null>) => {
      state.selectedSubcategory = action.payload;
    },
    setMinSalesThreshold: (state, action: PayloadAction<number | null>) => {
      state.minSalesThreshold = action.payload;
    },
    setSelectedMetrics: (state, action: PayloadAction<("sales" | "units" | "margin" | "price_bands")[]>) => {
      state.selectedMetrics = action.payload;
    },
    setCategoryLevel: (state, action: PayloadAction<"product" | "category" | "subcategory">) => {
      state.categoryLevel = action.payload;
    },
    resetFilters: (state) => {
      state.selectedCategory = null;
      state.selectedSubcategory = null;
      state.minSalesThreshold = 1000;
      state.categoryLevel = 'product';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductPerformance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductPerformance.fulfilled, (state, action: PayloadAction<ProductAnalysisResult>) => {
        state.loading = false;
        state.analysisResult = action.payload;
        
        // Transform the data for internal use
        if (action.payload.status === 'success' && action.payload.results) {
          const { sales, units, margin } = action.payload.results;
          
          // This is a simplified example - in a real implementation,
          // we would need to do more complex data transformation
          const processedData: Product[] = [];
          
          if (sales && sales.top_products) {
            sales.top_products.forEach(product => {
              const productData: Product = {
                product_name: product.product_name,
                sales_amount: product.sales_amount,
                quantity: 0, // Default
              };
              
              processedData.push(productData);
            });
          }
          
          state.data = processedData;
        }
      })
      .addCase(fetchProductPerformance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setDateRange,
  setSelectedCategory,
  setSelectedSubcategory,
  setMinSalesThreshold,
  setSelectedMetrics,
  setCategoryLevel,
  resetFilters,
} = productPerformanceSlice.actions;

// Export reducer
export default productPerformanceSlice.reducer; 