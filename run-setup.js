#!/usr/bin/env node

/**
 * FCC Database Setup Runner
 * 
 * This script runs the TypeScript setup script after compiling it
 */

// First compile the TypeScript files
require('child_process').execSync('npx tsx scripts/setup-fcc-database.ts', { 
  stdio: 'inherit',
  shell: true
});