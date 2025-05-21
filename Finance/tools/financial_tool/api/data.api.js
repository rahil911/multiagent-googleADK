// Node.js API handler for Financial Tool
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Database path resolution - assuming data.api.js is in Finance/tools/financial_tool/api/
// and the database is in Finance/database/
// const DB_PATH = path.join(__dirname, '../../../database/financial_agent.db');
// For Next.js API routes, __dirname might not be standard. A more robust way in Next.js:
// const DB_PATH = path.resolve(process.cwd(), 'Finance/database/financial_agent.db');
// Let's use a relative path that should work from where Next.js runs the API route.
// This assumes the CWD for the Next.js process is the project root.
const PROJECT_ROOT_DB_PATH = path.resolve('./Finance/database/financial_agent.db');

async function getDbConnection() {
    try {
        // Try the project root relative path first, as it's common for Next.js
        const db = await open({
            filename: PROJECT_ROOT_DB_PATH,
            driver: sqlite3.Database
        });
        // console.log('Successfully connected to DB_PATH:', PROJECT_ROOT_DB_PATH);
        return db;
    } catch (error) {
        // console.error('Failed to connect with PROJECT_ROOT_DB_PATH:', PROJECT_ROOT_DB_PATH, error);
        // Fallback or further error handling if needed
        // For now, rethrow if primary path fails, to make it clear.
        console.error(`Error opening database at ${PROJECT_ROOT_DB_PATH}:`, error);
        throw new Error(`Could not open database. Ensure the path is correct and the file exists. Path tried: ${PROJECT_ROOT_DB_PATH}`);
    }
}


/**
 * Main API handler
 * Determines the operation based on req.query.operation or req.body.operation
*/
export default async function handler(req, res) {
    let operation;
    let params;
    console.log('PROJECT_ROOT_DB_PATH:', PROJECT_ROOT_DB_PATH);
    
  if (req.method === 'GET') {
    operation = req.query.operation;
    params = { ...req.query };
    delete params.operation;
  } else if (req.method === 'POST') {
    operation = req.body.operation;
    params = { ...req.body };
    delete params.operation;
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  if (!operation) {
    return res.status(400).json({ error: "Operation not specified. Use ?operation=your_operation or include in POST body." });
  }

  let db;
  try {
    db = await getDbConnection();
    let result;

    switch (operation) {
      case 'cash_flow_analysis':
        result = await performCashFlowAnalysis(db, params);
        break;
      case 'revenue_forecast':
        result = await performRevenueForecast(db, params);
        break;
      case 'analyze_ar_aging':
        result = await performArAgingAnalysis(db, params);
        break;
      default:
        return res.status(400).json({ error: `Unknown operation: ${operation}` });
    }
    return res.status(200).json(result);
  } catch (error) {
    console.error(`Error in operation ${operation}:`, error);
    // Check if the error is a known type with a message, otherwise generic
    const errorMessage = error.message || 'An internal server error occurred.';
    // If it's a DB connection error specifically, we might want a more specific status
    if (errorMessage.startsWith('Could not open database')) {
        return res.status(500).json({ error: errorMessage, details: "Database connection failed." });
    }
    return res.status(500).json({ error: errorMessage });
  } finally {
    if (db) {
      await db.close();
    }
  }
}

// Helper function to calculate standard deviation
function calculateStdDev(array, mean) {
  if (!array || array.length === 0) return 0;
  const n = array.length;
  return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

// --- Cash Flow Analysis ---
async function performCashFlowAnalysis(db, params) {
  let { start_date, end_date } = params;

  let date_filter = "";
  const queryParams = {};

  if (!start_date && !end_date) {
    // Default to last 3 months - Get min/max dates from DB
    const dateRangeQuery = 'SELECT MIN("Posting Date") as earliest_date, MAX("Posting Date") as latest_date FROM "dbo_F_GL_Transaction"';
    const dateRange = await db.get(dateRangeQuery);
    if (dateRange && dateRange.latest_date) {
      const latestDate = new Date(dateRange.latest_date);
      const earliestDate = new Date(latestDate);
      earliestDate.setMonth(latestDate.getMonth() - 3);
      start_date = earliestDate.toISOString().split('T')[0];
      // end_date is implicitly the latest_date, so no filter needed for it unless specified.
    }
  }

  if (start_date) {
    date_filter += ' AND "Posting Date" >= $start_date';
    queryParams.$start_date = start_date;
  }
  if (end_date) {
    date_filter += ' AND "Posting Date" <= $end_date';
    queryParams.$end_date = end_date;
  }

  const query = `
    SELECT "Posting Date", "Txn Amount" 
    FROM "dbo_F_GL_Transaction"
    WHERE 1=1 ${date_filter}
    ORDER BY "Posting Date" ASC
  `;
  
  const transactions = await db.all(query, queryParams);

  if (transactions.length === 0) {
    return { error: "No data found for the specified period. Please try a different date range." };
  }

  // Process transactions
  let cumulativeCashFlow = 0;
  const dailyCashFlows = {};

  transactions.forEach(txn => {
    const date = txn["Posting Date"]; // Already YYYY-MM-DD string from SQLite
    const amount = parseFloat(txn["Txn Amount"]);
    dailyCashFlows[date] = (dailyCashFlows[date] || 0) + amount;
  });

  const cashFlowSeries = Object.entries(dailyCashFlows).map(([date, amount]) => {
    cumulativeCashFlow += amount;
    return { date, amount, cumulativeAmount: cumulativeCashFlow };
  });
  
  const allTxnAmounts = cashFlowSeries.map(cf => cf.amount);
  const totalInflow = allTxnAmounts.filter(a => a > 0).reduce((sum, a) => sum + a, 0);
  const totalOutflow = allTxnAmounts.filter(a => a < 0).reduce((sum, a) => sum + a, 0);
  const netCashFlow = totalInflow + totalOutflow;
  const dailyAverage = netCashFlow / cashFlowSeries.length;
  const meanDailyFlow = cashFlowSeries.reduce((sum, cf) => sum + cf.amount, 0) / cashFlowSeries.length;
  const dailyVolatility = calculateStdDev(allTxnAmounts, meanDailyFlow);

  const metrics = {
    total_inflow: totalInflow,
    total_outflow: totalOutflow,
    net_cash_flow: netCashFlow,
    daily_average: dailyAverage,
    daily_volatility: dailyVolatility,
    start_date: cashFlowSeries[0]?.date,
    end_date: cashFlowSeries[cashFlowSeries.length - 1]?.date,
    num_days_data: cashFlowSeries.length
  };

  // Seasonal patterns (monthly average)
  const monthlyPatterns = {};
  cashFlowSeries.forEach(cf => {
    const month = new Date(cf.date).getMonth() + 1; // 1-12
    if (!monthlyPatterns[month]) {
      monthlyPatterns[month] = { amounts: [], count: 0 };
    }
    monthlyPatterns[month].amounts.push(cf.amount);
    monthlyPatterns[month].count++;
  });

  const seasonal_patterns = {};
  for (const month in monthlyPatterns) {
    const monthData = monthlyPatterns[month];
    const mean = monthData.amounts.reduce((s, a) => s + a, 0) / monthData.count;
    const std = calculateStdDev(monthData.amounts, mean);
    seasonal_patterns[month] = { mean, std, count: monthData.count };
  }

  // Anomaly detection (simplified: +/- 2 std dev from mean daily flow)
  const anomalyThreshold = 2 * dailyVolatility;
  const anomalies = cashFlowSeries.filter(
    cf => Math.abs(cf.amount - meanDailyFlow) > anomalyThreshold
  ).map(cf => ({
    "Posting Date": cf.date,
    "Txn Amount": cf.amount,
    "Cumulative Cash Flow": cf.cumulativeAmount,
    "Deviation": cf.amount - meanDailyFlow
  }));

  return {
    metrics,
    cashFlowSeries, // For plotting timeline
    seasonal_patterns,
    anomalies,
    // visualization_path: "N/A in JS backend, frontend should generate Plotly from series"
  };
}

// --- Revenue Forecast ---
// Placeholder - complex ML replication is a large task
async function performRevenueForecast(db, params) {
  let { days_ahead = 30 } = params;
  days_ahead = parseInt(days_ahead);

  const query = `
    SELECT "Posting Date", "Txn Amount" 
    FROM "dbo_F_GL_Transaction"
    WHERE "Txn Amount" > 0
    ORDER BY "Posting Date" ASC
  `;
  const transactions = await db.all(query);

  if (transactions.length === 0) {
    return { error: "No revenue data found for forecasting" };
  }

  // Aggregate by posting date to get daily revenue
  const dailyRevenueMap = {};
  transactions.forEach(txn => {
    const date = txn["Posting Date"];
    dailyRevenueMap[date] = (dailyRevenueMap[date] || 0) + parseFloat(txn["Txn Amount"]);
  });

  let historicalRevenue = Object.entries(dailyRevenueMap).map(([date, amount]) => ({
    date, // YYYY-MM-DD
    amount
  })).sort((a,b) => new Date(a.date) - new Date(b.date));

  if (historicalRevenue.length < 30) {
     return { error: `Insufficient data for forecasting (need at least 30 days, got ${historicalRevenue.length})` };
  }
  
  // Feature engineering (simplified)
  historicalRevenue.forEach(r => {
    const d = new Date(r.date);
    r.day_of_week = d.getDay(); // 0 (Sun) - 6 (Sat)
    r.month = d.getMonth() + 1; // 1-12
    r.day_of_month = d.getDate();
  });

  // Simplified forecast: moving average of the last N days or similar simple model
  // For this example, let's use a 7-day moving average for forecasting
  const forecastData = [];
  let lastKnownDate = new Date(historicalRevenue[historicalRevenue.length - 1].date);
  let currentRevenueSeries = historicalRevenue.map(r => r.amount);

  for (let i = 1; i <= days_ahead; i++) {
    let forecastAmount;
    const seriesLength = currentRevenueSeries.length;
    if (seriesLength >= 7) {
      forecastAmount = currentRevenueSeries.slice(-7).reduce((sum, val) => sum + val, 0) / 7;
    } else if (seriesLength > 0) { // Average of whatever is available if less than 7
      forecastAmount = currentRevenueSeries.reduce((sum, val) => sum + val, 0) / seriesLength;
    } else {
      forecastAmount = 0; // Should not happen if we check historicalRevenue.length
    }
    
    const nextDate = new Date(lastKnownDate);
    nextDate.setDate(lastKnownDate.getDate() + i);
    
    forecastData.push({
      "Posting Date": nextDate.toISOString().split('T')[0],
      predicted: forecastAmount
    });
    // Add this prediction to series for next step if we want a rolling forecast based on predictions
    // For simple MA on historical only, this is not needed.
    // currentRevenueSeries.push(forecastAmount); 
  }
  
  // Simplified accuracy (e.g., MAPE on last few historical points if we built a "model")
  // For now, since it's a simple MA, traditional accuracy metrics are less direct.
  // The Python version does proper train/test. This is a heavy simplification.
  const accuracy_metrics = {
    mape: "N/A for simplified model",
    rmse: "N/A for simplified model",
    info: "Forecasting is highly simplified (7-day moving average of historical data)."
  };
  
  // Feature importance is not applicable for this simple model.
  const model_importance = { info: "N/A for simplified model" };

  return {
    forecast: forecastData,
    forecast_total: forecastData.reduce((sum, item) => sum + item.predicted, 0),
    historical_data_points: historicalRevenue.length,
    accuracy_metrics,
    model_importance,
    // visualization_path: "N/A"
  };
}


// --- AR Aging Analysis ---
async function performArAgingAnalysis(db, params) {
  let { aging_buckets, include_visualization = true } = params;

  if (!aging_buckets) {
    aging_buckets = {
      'current': [0, 30],
      '31-60_days': [31, 60],
      '61-90_days': [61, 90],
      '91-120_days': [91, 120],
      'over_120_days': [121, Infinity]
    };
  }

  // Using Sales Transaction data as a proxy for AR
  const query = `
    SELECT 
        "Customer Key", 
        "Sales Txn Number" as "Invoice Number", 
        "Txn Date" as "Posting Date", 
        "Net Sales Amount" as "Balance Due Amount"
    FROM "dbo_F_Sales_Transaction"
    WHERE "Sales Txn Type" = 'Sales Invoice'
  `;
  const raw_ar_data = await db.all(query);

  if (raw_ar_data.length === 0) {
    return { error: "No sales invoice data found to use as accounts receivable proxy" };
  }

  const today = new Date();
  const ar_data = raw_ar_data.map(row => {
    const postingDate = new Date(row["Posting Date"]);
    // Assuming due date is 30 days after posting for this proxy data
    const dueDate = new Date(postingDate);
    dueDate.setDate(postingDate.getDate() + 30);

    let daysOverdue = 0;
    if (dueDate < today) {
      daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
    }
    return {
      ...row,
      "Balance Due Amount": parseFloat(row["Balance Due Amount"]),
      "Posting Date": postingDate.toISOString().split('T')[0],
      "Due Date": dueDate.toISOString().split('T')[0],
      "Days Overdue": daysOverdue
    };
  });

  const bucket_totals = {};
  let total_ar_amount = 0;

  for (const bucketName in aging_buckets) {
    const [min_days, max_days] = aging_buckets[bucketName];
    const matching_invoices = ar_data.filter(
      ar => ar["Days Overdue"] >= min_days && ar["Days Overdue"] <= max_days
    );
    const amountInBucket = matching_invoices.reduce((sum, inv) => sum + inv["Balance Due Amount"], 0);
    bucket_totals[bucketName] = {
      count: matching_invoices.length,
      amount: amountInBucket,
      invoices: matching_invoices.map(inv => inv["Invoice Number"]) // Optional: list of invoices
    };
  }
  
  ar_data.forEach(ar => total_ar_amount += ar["Balance Due Amount"]);

  for (const bucketName in bucket_totals) {
    bucket_totals[bucketName].percentage = total_ar_amount > 0 ? (bucket_totals[bucketName].amount / total_ar_amount) * 100 : 0;
  }
  
  const total_overdue_amount = ar_data
    .filter(ar => ar["Days Overdue"] > 30)
    .reduce((sum, ar) => sum + ar["Balance Due Amount"], 0);
  
  const total_current_amount = ar_data
    .filter(ar => ar["Days Overdue"] >= 0 && ar["Days Overdue"] <= 30) // Assuming 0-30 is current
    .reduce((sum, ar) => sum + ar["Balance Due Amount"], 0);

  const overall_metrics = {
    total_ar_balance: total_ar_amount,
    total_current_balance: total_current_amount,
    total_overdue_balance: total_overdue_amount,
    percent_overdue: total_ar_amount > 0 ? (total_overdue_amount / total_ar_amount) * 100 : 0,
    avg_days_outstanding: ar_data.length > 0 ? ar_data.reduce((sum, ar) => sum + ar["Days Overdue"], 0) / ar_data.length : 0,
    report_date: today.toISOString().split('T')[0],
    total_invoices: ar_data.length
  };

  // Customer metrics (simplified)
  const customer_summary = {};
  ar_data.forEach(ar => {
    const custKey = ar["Customer Key"];
    if (!customer_summary[custKey]) {
      customer_summary[custKey] = { total_due: 0, overdue_due: 0, invoice_count: 0 };
    }
    customer_summary[custKey].total_due += ar["Balance Due Amount"];
    customer_summary[custKey].invoice_count++;
    if (ar["Days Overdue"] > 0) { // Or specific threshold like >30
        customer_summary[custKey].overdue_due += ar["Balance Due Amount"];
    }
  });
  const total_customers_with_ar = Object.keys(customer_summary).length;
  const customers_with_overdue = Object.values(customer_summary).filter(c => c.overdue_due > 0).length;

  const customer_metrics = {
      total_customers_with_ar,
      customers_with_overdue_balances: customers_with_overdue,
      percent_customers_overdue: total_customers_with_ar > 0 ? (customers_with_overdue / total_customers_with_ar) * 100 : 0
      // customer_details: customer_summary // Could be large, return summarized form or top N
  };
  
  // High-value overdue accounts (e.g., top 5 by overdue amount)
  const high_value_overdue_threshold = overall_metrics.total_ar_balance * 0.05; // Example: 5% of total AR
  const high_value_accounts_list = Object.entries(customer_summary)
    .map(([customer_key, data]) => ({ customer_key, ...data }))
    .filter(c => c.overdue_due > 0 && c.overdue_due >= high_value_overdue_threshold) // Filter by those with overdue amounts & a threshold
    .sort((a, b) => b.overdue_due - a.overdue_due)
    .slice(0, 5) // Top 5
    .map(acc => ({ customer_id: acc.customer_key, overdue_amount: acc.overdue_due, total_due: acc.total_due }));


  // The Python version returns a formatted string. For an API, JSON is usually better.
  // If a string is strictly needed, we can build it. Otherwise, return structured data.
  // Let's return structured data for now.
  return {
    report_date: today.toISOString().split('T')[0],
    overall_metrics,
    aging_buckets_summary: bucket_totals,
    customer_metrics,
    top_high_value_overdue_accounts: high_value_accounts_list,
    // raw_data_sample: ar_data.slice(0, 5) // Optional for debugging
  };
}

// Note: The Plotly visualization part from Python (saving HTML files) is not replicated here.
// The frontend would typically use a library like Plotly.js or Chart.js to consume the JSON data
// (e.g., cashFlowSeries, forecastData, ar_aging_summary) and render charts.

// API client for the Financial Tool

const API_BASE_URL = '/api/financial-tool'; // Adjust if your API routes are different

/**
 * Calls the cash flow analysis endpoint.
 * @param {object} params - The parameters for cash flow analysis.
 * @param {string} [params.start_date] - Optional start date in YYYY-MM-DD format.
 * @param {string} [params.end_date] - Optional end date in YYYY-MM-DD format.
 * @returns {Promise<object>} The cash flow analysis results.
 */
async function analyzeCashFlow(params = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/cash-flow-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling cash flow analysis API:', error);
    throw error;
  }
}

/**
 * Calls the revenue forecast endpoint.
 * @param {object} params - The parameters for revenue forecasting.
 * @param {number} [params.days_ahead=30] - Number of days to forecast.
 * @returns {Promise<object>} The revenue forecast results.
 */
async function forecastRevenue(params = { days_ahead: 30 }) {
  try {
    const response = await fetch(`${API_BASE_URL}/revenue-forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error calling revenue forecast API:', error);
    throw error;
  }
}

/**
 * Calls the AR aging analysis endpoint.
 * @param {object} params - The parameters for AR aging analysis.
 * @param {object} [params.aging_buckets] - Optional custom aging buckets.
 * @param {boolean} [params.include_visualization=true] - Whether to include visualizations.
 * @returns {Promise<string>} The AR aging analysis results as a string (or object if backend returns JSON).
 */
async function analyzeArAging(params = { include_visualization: true }) {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-ar-aging`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
    if (!response.ok) {
      const errorData = await response.json(); // Assuming error is JSON
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    // The Python tool returns a string for AR aging, but if it were JSON:
    // return await response.json(); 
    return await response.text(); // Since the current python tool returns a string.
  } catch (error) {
    console.error('Error calling AR aging analysis API:', error);
    throw error;
  }
}

export { analyzeCashFlow, forecastRevenue, analyzeArAging };

// Example Usage (for testing in a browser console or another JS file):
/*
async function testFinancialApis() {
  try {
    console.log('Testing Cash Flow Analysis...');
    const cashFlowParams = { start_date: '2023-01-01', end_date: '2023-03-31' };
    const cashFlowResult = await analyzeCashFlow(cashFlowParams);
    console.log('Cash Flow Result:', cashFlowResult);

    console.log('\\nTesting Revenue Forecast...');
    const revenueParams = { days_ahead: 60 };
    const revenueResult = await forecastRevenue(revenueParams);
    console.log('Revenue Forecast Result:', revenueResult);

    console.log('\\nTesting AR Aging Analysis...');
    const arParams = { 
      // aging_buckets: {
      //   'current': [0, 15], 
      //   '16-30_days': [16, 30],
      //   'over_30_days': [31, Infinity]
      // },
      include_visualization: true 
    };
    const arResult = await analyzeArAging(arParams);
    console.log('AR Aging Result:', arResult);

  } catch (error) {
    console.error('Error during API tests:', error);
  }
}

// To run the test:
// 1. Ensure your Next.js (or other backend) server is running and serving these API routes.
// 2. Open your browser's developer console on a page where this script is loaded (or import it into another JS module).
// 3. Call `testFinancialApis();`
*/ 