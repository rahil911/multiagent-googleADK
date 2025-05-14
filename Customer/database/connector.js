/**
 * Database connector for Customer tools using SQLite
 * This matches the SQLite database used in transaction_patterns.py
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { handleError } = require('./utils');
const path = require('path');
const fs = require('fs');

/**
 * Path to the SQLite database file used in transaction_patterns.py
 */
// Use the absolute path that we confirmed works in the test
const DB_PATH = path.resolve(__dirname, './customers.db');

/**
 * Customer database connector for SQLite
 */
class CustomerDatabaseConnector {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Connect to the SQLite database
   */
  async connect() {
    try {
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      });
      console.log(`Connected to SQLite database: ${this.dbPath}`);
      return this;
    } catch (error) {
      handleError('Failed to connect to SQLite database', error);
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(sql, params = []) {
    try {
      if (!this.db) {
        await this.connect();
      }
      const results = await this.db.all(sql, params);
      return results;
    } catch (error) {
      handleError('Error executing query', error, { sql, params });
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.db) {
      try {
        await this.db.close();
        console.log('SQLite database connection closed');
      } catch (error) {
        handleError('Error closing database connection', error);
      }
      this.db = null;
    }
  }
}

// Create and export the connector instance
const customerDatabaseConnector = new CustomerDatabaseConnector(DB_PATH);

module.exports = {
  customerDatabaseConnector
}; 