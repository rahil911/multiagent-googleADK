const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

export default async function handler(req, res) {
  try {
    const dbPath = path.join(process.cwd(), 'Customer/database/customers.db');
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    // Query all customers with RFM/loyalty and latest transaction metrics
    const query = `
      SELECT 
        c."Customer Key" as customer_id,
        c."Customer Name" as name,
        cl."RFM Score" as rfm,
        MAX(t."Txn Date") as last_purchase_date,
        COUNT(t."Sales Txn Key") as frequency,
        ROUND(AVG(t."Net Sales Amount"), 2) as avg_order_value
      FROM dbo_D_Customer c
      LEFT JOIN dbo_F_Sales_Transaction t ON c."Customer Key" = t."Customer Key"
      LEFT JOIN dbo_F_Customer_Loyalty cl ON c."Customer Key" = cl."Entity Key"
      WHERE c."Customer Key" > 0
      GROUP BY c."Customer Key", c."Customer Name", cl."RFM Score"
      HAVING COUNT(t."Sales Txn Key") > 0
    `;
    const customers = await db.all(query);

    // Add dummy churn probability and risk level for now
    customers.forEach(c => {
      c.churn_probability = Math.random();
      c.risk_level = c.churn_probability > 0.8 ? 'Very High'
        : c.churn_probability > 0.6 ? 'High'
        : c.churn_probability > 0.3 ? 'Medium'
        : 'Low';
    });

    // After fetching customers, add the following:
    const probabilities = customers.map(c => c.churn_probability);
    // Dummy feature importance for now (replace with real model output if available)
    const feature_importance = [
      { feature: 'Recency', importance: 0.32 },
      { feature: 'Frequency', importance: 0.24 },
      { feature: 'Avg Order Value', importance: 0.18 },
      { feature: 'RFM', importance: 0.14 },
      { feature: 'Diversity', importance: 0.12 }
    ];
    // Dummy time series (replace with real SQL aggregation if available)
    const risk_time_series = [
      { date: '2024-06-01', low: 120, medium: 60, high: 30, very_high: 10 },
      { date: '2024-07-01', low: 110, medium: 70, high: 35, very_high: 15 },
      { date: '2024-08-01', low: 100, medium: 80, high: 40, very_high: 20 }
    ];
    // Dummy segment matrix (replace with real SQL aggregation if available)
    const segment_matrix = [
      { segment: 'Enterprise', low: 40, medium: 20, high: 10, very_high: 5 },
      { segment: 'SMB', low: 60, medium: 30, high: 15, very_high: 8 },
      { segment: 'Consumer', low: 80, medium: 40, high: 20, very_high: 10 }
    ];
    // Dummy retention strategies
    const retention_strategies = [
      { title: 'Re-engagement Email Campaign', description: 'Target customers with 30+ days since last purchase with personalized offers.', impact: '+12% retention', effort: 'Medium' },
      { title: 'Proactive Support Outreach', description: 'Contact high-risk customers with recent support issues.', impact: '+8% retention', effort: 'High' }
    ];
    // Dummy insights
    const insights = [
      { title: 'Recent Risk Increase', content: '15% increase in high-risk customers over the past 30 days, driven by decreased purchase frequency in Enterprise.', type: 'alert' },
      { title: 'Key Factor: Support Interactions', content: 'Support ticket volume is the top churn driver for high-risk customers.', type: 'factor' }
    ];

    await db.close();
    res.status(200).json({
      status: 'success',
      customers,
      probabilities,
      feature_importance,
      risk_time_series,
      segment_matrix,
      retention_strategies,
      insights
    });
  } catch (error) {
    console.error('Error fetching churn prediction data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch churn prediction data',
      error: error.message
    });
  }
} 