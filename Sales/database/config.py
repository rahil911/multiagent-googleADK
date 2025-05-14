"""
Configuration settings for the Sales Analytics Multi-Agent System.
"""

import os
from pathlib import Path

# Database configuration
DATABASE = {
    'path': os.path.abspath(os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'database',
        'sales_agent.db'
    ))
}

# Logging configuration
LOGGING = {
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': None  # Set to None for console logging
}

# Analysis Configuration
ANALYSIS = {
    'default_timeframe': 'last_30_days',
    'supported_timeframes': ['last_7_days', 'last_30_days', 'last_90_days', 'last_year'],
    'min_data_points': 10,
    'confidence_interval': 0.95
}

# Visualization configuration
VISUALIZATION = {
    'default_figure_size': (12, 6),
    'style': 'seaborn'
}

# Ensure log directory exists
if LOGGING['file']:
    log_dir = os.path.dirname(LOGGING['file'])
    os.makedirs(log_dir, exist_ok=True)
