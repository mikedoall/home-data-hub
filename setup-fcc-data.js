#!/usr/bin/env node

/**
 * FCC Database Setup Runner
 * 
 * This script runs the TypeScript setup script after compiling it
 * 
 * Run with: node setup-fcc-data.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// First compile the TypeScript script
console.log('Compiling TypeScript scripts...');
try {
  execSync('npx tsx scripts/setup-fcc-database.ts', { stdio: 'inherit' });
} catch (error) {
  console.error('Error running FCC database setup:', error);
  process.exit(1);
}