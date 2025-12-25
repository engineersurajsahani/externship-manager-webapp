#!/usr/bin/env node

const { execSync } = require('child_process');

// Increase Node.js memory limit and run the build
try {
  console.log('Starting optimized build process...');
  execSync('node --max_old_space_size=4096 node_modules/.bin/react-scripts build', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}