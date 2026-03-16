# Quick Setup Script for hnswlib-node on Windows
# This script tries multiple approaches to get hnswlib-node working

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  hnswlib-node Windows Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Step 1: Configure npm
Write-Host "`n[1/3] Configuring npm..." -ForegroundColor Yellow
npm config set python python3
npm config set msvs_version 2022
Write-Host "  ✅ npm configured" -ForegroundColor Green

# Step 2: Try installing with different methods
Write-Host "`n[2/3] Attempting to install hnswlib-node..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Gray

# Method 1: Try normal install
Write-Host "`n  Trying standard installation..." -ForegroundColor Cyan
$result = npm install hnswlib-node 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ Installation successful!" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Standard installation failed, trying alternatives..." -ForegroundColor Yellow
    
    # Method 2: Try with --build-from-source=false (if pre-built binaries available)
    Write-Host "`n  Trying with pre-built binaries..." -ForegroundColor Cyan
    npm install hnswlib-node --build-from-source=false 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Installation successful with pre-built binaries!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Installation failed" -ForegroundColor Red
        Write-Host "`n  You need to install Visual Studio Build Tools:" -ForegroundColor Yellow
        Write-Host "    1. Download: https://visualstudio.microsoft.com/downloads/" -ForegroundColor White
        Write-Host "    2. Select 'Build Tools for Visual Studio 2022'" -ForegroundColor White
        Write-Host "    3. Install with 'Desktop development with C++' workload" -ForegroundColor White
        Write-Host "    4. Run this script again" -ForegroundColor White
    }
}

# Step 3: Verify installation
Write-Host "`n[3/3] Verifying installation..." -ForegroundColor Yellow
if (Test-Path "node_modules\hnswlib-node") {
    Write-Host "  ✅ Package found" -ForegroundColor Green
    
    # Try to test it
    $testScript = @"
try {
  const HNSWLib = require('hnswlib-node');
  console.log('SUCCESS');
} catch(e) {
  console.log('ERROR: ' + e.message);
  process.exit(1);
}
"@
    
    $testResult = $testScript | node 2>&1
    if ($testResult -like "*SUCCESS*") {
        Write-Host "  ✅ Module loads successfully!" -ForegroundColor Green
        Write-Host "`n✅ hnswlib-node is ready to use!" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Package installed but module needs rebuilding" -ForegroundColor Yellow
        Write-Host "  Trying to rebuild..." -ForegroundColor Cyan
        npm rebuild hnswlib-node 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ Rebuild successful!" -ForegroundColor Green
        } else {
            Write-Host "  ❌ Rebuild failed - Visual Studio Build Tools required" -ForegroundColor Red
        }
    }
} else {
    Write-Host "  ❌ Package not found" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan

