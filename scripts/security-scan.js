#!/usr/bin/env node

/**
 * Docker Security Scanning Script for Leily Application
 * Cross-platform Node.js version for comprehensive security scanning
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  imageName: 'leily',
  imageTag: 'latest',
  severityThreshold: 'high',
  outputDir: './security-reports'
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

// Utility functions
const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const logError = (message) => log(`❌ ${message}`, 'red');
const logSuccess = (message) => log(`✅ ${message}`, 'green');
const logInfo = (message) => log(`🔍 ${message}`, 'blue');
const logWarning = (message) => log(`⚠️  ${message}`, 'yellow');

// Check if command exists
const commandExists = (command) => {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch {
    try {
      execSync(`where ${command}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
};

// Check prerequisites
const checkPrerequisites = () => {
  log('🔒 Leily Security Scanning Script', 'blue');
  log('==================================');

  // Check if Snyk is installed
  if (!commandExists('snyk')) {
    logError('Snyk CLI not found. Please install it first:');
    log('npm install -g snyk');
    log('or');
    log('npm install snyk --save-dev');
    process.exit(1);
  }
  logSuccess('Snyk CLI found');

  // Check if Docker is running
  try {
    execSync('docker info', { stdio: 'ignore' });
    logSuccess('Docker is running');
  } catch {
    logError('Docker is not running. Please start Docker first.');
    process.exit(1);
  }
};

// Create output directory
const createOutputDir = () => {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
};

// Build Docker image
const buildImage = () => {
  const fullImageName = `${CONFIG.imageName}:${CONFIG.imageTag}`;
  logInfo(`Building Docker image: ${fullImageName}`);
  
  try {
    execSync(`docker build -t ${fullImageName} .`, { stdio: 'inherit' });
    logSuccess('Docker image built successfully');
    return fullImageName;
  } catch (error) {
    logError('Failed to build Docker image');
    process.exit(1);
  }
};

// Run Snyk command with error handling
const runSnykCommand = (command, outputFile, description) => {
  return new Promise((resolve) => {
    logInfo(`${description}...`);
    
    const child = spawn('snyk', command, { stdio: ['inherit', 'pipe', 'pipe'] });
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      if (outputFile) {
        fs.writeFileSync(outputFile, output);
      }
      
      if (code === 0) {
        logSuccess(`${description} completed`);
      } else {
        logWarning(`${description} completed with warnings (exit code: ${code})`);
      }
      
      resolve({ code, output, errorOutput });
    });
  });
};

// Scan Docker container
const scanContainer = async (imageName) => {
  const containerScanJson = path.join(CONFIG.outputDir, 'container-scan.json');
  const containerScanSarif = path.join(CONFIG.outputDir, 'container-scan.sarif');
  
  await runSnykCommand(
    ['container', 'test', imageName, '--severity-threshold', CONFIG.severityThreshold, '--json'],
    containerScanJson,
    'Scanning Docker container for vulnerabilities'
  );
  
  await runSnykCommand(
    ['container', 'test', imageName, '--severity-threshold', CONFIG.severityThreshold, '--sarif'],
    containerScanSarif,
    'Generating SARIF report for container'
  );
};

// Scan Dockerfile
const scanDockerfile = async () => {
  if (!fs.existsSync('Dockerfile')) {
    logWarning('Dockerfile not found, skipping');
    return;
  }
  
  const dockerfileScanJson = path.join(CONFIG.outputDir, 'dockerfile-scan.json');
  const dockerfileScanSarif = path.join(CONFIG.outputDir, 'dockerfile-scan.sarif');
  
  await runSnykCommand(
    ['iac', 'test', 'Dockerfile', '--severity-threshold', CONFIG.severityThreshold, '--json'],
    dockerfileScanJson,
    'Scanning Dockerfile for security issues'
  );
  
  await runSnykCommand(
    ['iac', 'test', 'Dockerfile', '--severity-threshold', CONFIG.severityThreshold, '--sarif'],
    dockerfileScanSarif,
    'Generating SARIF report for Dockerfile'
  );
};

// Scan docker-compose.yml
const scanCompose = async () => {
  if (!fs.existsSync('docker-compose.yml')) {
    logWarning('docker-compose.yml not found, skipping');
    return;
  }
  
  const composeScanJson = path.join(CONFIG.outputDir, 'compose-scan.json');
  
  await runSnykCommand(
    ['iac', 'test', 'docker-compose.yml', '--severity-threshold', CONFIG.severityThreshold, '--json'],
    composeScanJson,
    'Scanning docker-compose.yml'
  );
};

// Scan dependencies
const scanDependencies = async () => {
  const dependenciesScanJson = path.join(CONFIG.outputDir, 'dependencies-scan.json');
  const dependenciesScanSarif = path.join(CONFIG.outputDir, 'dependencies-scan.sarif');
  
  await runSnykCommand(
    ['test', '--severity-threshold', CONFIG.severityThreshold, '--json'],
    dependenciesScanJson,
    'Scanning Node.js dependencies'
  );
  
  await runSnykCommand(
    ['test', '--severity-threshold', CONFIG.severityThreshold, '--sarif'],
    dependenciesScanSarif,
    'Generating SARIF report for dependencies'
  );
};

// Generate summary report
const generateSummary = (imageName) => {
  logInfo('Generating security summary...');
  
  const summaryFile = path.join(CONFIG.outputDir, 'security-summary.md');
  const timestamp = new Date().toISOString();
  
  const summary = `# Security Scan Summary

**Generated:** ${timestamp}
**Image:** ${imageName}
**Severity Threshold:** ${CONFIG.severityThreshold}

## Scan Results

### Container Scan
- **File:** \`container-scan.json\`
- **SARIF:** \`container-scan.sarif\`

### Dockerfile Scan
- **File:** \`dockerfile-scan.json\`
- **SARIF:** \`dockerfile-scan.sarif\`

### Dependencies Scan
- **File:** \`dependencies-scan.json\`
- **SARIF:** \`dependencies-scan.sarif\`

## Next Steps

1. Review scan results in the JSON files
2. Address high-severity vulnerabilities immediately
3. Upload SARIF files to GitHub Security tab
4. Monitor ongoing security with Snyk dashboard

## Files Generated

\`\`\`
${CONFIG.outputDir}/
├── container-scan.json
├── container-scan.sarif
├── dockerfile-scan.json
├── dockerfile-scan.sarif
├── dependencies-scan.json
├── dependencies-scan.sarif
└── security-summary.md
\`\`\`
`;

  fs.writeFileSync(summaryFile, summary);
  logSuccess(`Summary report generated: ${summaryFile}`);
};

// Display results
const displayResults = () => {
  log('📋 Security Scan Results', 'blue');
  log('========================');
  
  // Try to parse and display vulnerability counts
  try {
    const containerScanFile = path.join(CONFIG.outputDir, 'container-scan.json');
    if (fs.existsSync(containerScanFile)) {
      const containerData = JSON.parse(fs.readFileSync(containerScanFile, 'utf8'));
      const vulnCount = containerData.vulnerabilities ? containerData.vulnerabilities.length : 0;
      log(`Container vulnerabilities: ${vulnCount}`, 'yellow');
    }
    
    const dependenciesScanFile = path.join(CONFIG.outputDir, 'dependencies-scan.json');
    if (fs.existsSync(dependenciesScanFile)) {
      const dependenciesData = JSON.parse(fs.readFileSync(dependenciesScanFile, 'utf8'));
      const depVulnCount = dependenciesData.vulnerabilities ? dependenciesData.vulnerabilities.length : 0;
      log(`Dependency vulnerabilities: ${depVulnCount}`, 'yellow');
    }
  } catch (error) {
    logWarning('Could not parse vulnerability counts');
  }
  
  log(`\n📁 Reports saved to: ${CONFIG.outputDir}/`, 'blue');
  log('🌐 View detailed reports at: https://app.snyk.io', 'blue');
};

// Main execution
const main = async () => {
  const args = process.argv.slice(2);
  const shouldBuild = args.includes('--build') || args.includes('-b');
  
  try {
    // Pre-flight checks
    checkPrerequisites();
    createOutputDir();
    
    // Build image if requested
    let imageName = `${CONFIG.imageName}:${CONFIG.imageTag}`;
    if (shouldBuild) {
      imageName = buildImage();
    }
    
    // Run all scans
    await scanContainer(imageName);
    await scanDockerfile();
    await scanCompose();
    await scanDependencies();
    
    // Generate reports
    generateSummary(imageName);
    displayResults();
    
    logSuccess('🎉 Security scan completed successfully!');
  } catch (error) {
    logError(`Security scan failed: ${error.message}`);
    process.exit(1);
  }
};

// Help function
const showHelp = () => {
  log('Usage: node scripts/security-scan.js [OPTIONS]');
  log('');
  log('Options:');
  log('  --build, -b    Build Docker image before scanning');
  log('  --help, -h     Show this help message');
  log('');
  log('Examples:');
  log('  node scripts/security-scan.js                    # Scan existing image');
  log('  node scripts/security-scan.js --build             # Build and scan image');
  log('');
  log('Prerequisites:');
  log('  - Docker running');
  log('  - Snyk CLI installed');
  log('  - Authenticated with Snyk (run "snyk auth")');
};

// Parse arguments and run
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

main();
