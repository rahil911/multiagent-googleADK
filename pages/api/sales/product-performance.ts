import { NextApiRequest, NextApiResponse } from 'next';
import { spawn } from 'child_process';
import path from 'path';

/**
 * API handler for Product Performance Analyzer
 * 
 * This API route interfaces with the Python ProductPerformanceAnalyzer class
 * to retrieve product performance analysis data
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: 'error', message: 'Method not allowed' });
  }

  try {
    const { start_date, end_date, metrics, category_level, min_sales_threshold } = req.body;

    // Validate required parameters
    if (!start_date || !end_date || !metrics || !Array.isArray(metrics)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid parameters. Required: start_date, end_date, metrics (array)'
      });
    }

    // Construct arguments for Python script
    const args = [
      path.resolve('Sales/tools/ProductPerformanceAnalyzer/api_runner.py'),
      '--start_date', start_date,
      '--end_date', end_date,
      '--metrics', metrics.join(','),
    ];

    // Add optional parameters if provided
    if (category_level) {
      args.push('--category_level', category_level);
    }
    
    if (min_sales_threshold !== undefined && min_sales_threshold !== null) {
      args.push('--min_sales_threshold', min_sales_threshold.toString());
    }

    // Execute Python process
    const pythonProcess = spawn('python', args);
    
    let dataString = '';
    let errorString = '';

    // Collect data from stdout
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Collect any errors from stderr
    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    // Handle process completion
    const result = await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`Python process exited with code ${code}`);
          console.error('Error output:', errorString);
          reject(new Error(`Python process failed with code ${code}: ${errorString}`));
        } else {
          try {
            const jsonData = JSON.parse(dataString);
            resolve(jsonData);
          } catch (e) {
            console.error('Failed to parse JSON:', e);
            console.error('Raw output:', dataString);
            reject(new Error('Failed to parse analyzer output'));
          }
        }
      });
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      status: 'error',
      message: (error as Error).message || 'An unexpected error occurred'
    });
  }
} 