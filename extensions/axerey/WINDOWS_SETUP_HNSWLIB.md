# Windows 11 Setup Guide for hnswlib-node

This guide will help you configure `hnswlib-node` on Windows 11 with Visual Studio.

## Prerequisites

### 1. Visual Studio Build Tools (Required)

`hnswlib-node` is a native Node.js module that requires C++ compilation. You need Visual Studio Build Tools or full Visual Studio.

#### Option A: Visual Studio Build Tools (Recommended - Lighter)
1. Download **Visual Studio Build Tools** from: https://visualstudio.microsoft.com/downloads/
2. Run the installer
3. Select **"Desktop development with C++"** workload
4. Ensure these components are included:
   - MSVC v143 - VS 2022 C++ x64/x86 build tools
   - Windows 10/11 SDK (latest version)
   - C++ CMake tools for Windows

#### Option B: Full Visual Studio
1. Download **Visual Studio Community** (free) from: https://visualstudio.microsoft.com/downloads/
2. During installation, select **"Desktop development with C++"** workload
3. Same components as above

### 2. Python (Required for node-gyp)

`hnswlib-node` uses `node-gyp` which requires Python:

1. Download **Python 3.11 or 3.12** from: https://www.python.org/downloads/
2. **IMPORTANT**: During installation, check **"Add Python to PATH"**
3. Verify installation:
   ```powershell
   python --version
   ```

### 3. Node.js and npm (Already Installed ✅)

You have:
- Node.js v24.5.0 ✅
- npm 11.5.1 ✅

## Installation Steps

### Step 1: Configure npm for Windows Build Tools

Open PowerShell as Administrator and run:

```powershell
# Configure npm to use the correct Python version
npm config set python python3

# Set MSVS version (if using Visual Studio 2022)
npm config set msvs_version 2022

# Verify configuration
npm config list
```

### Step 2: Install Windows Build Tools (Alternative Method)

If you prefer, you can use `windows-build-tools` (deprecated but sometimes helpful):

```powershell
npm install --global windows-build-tools
```

**Note**: This is deprecated, but can help if you're having issues. The recommended approach is installing Visual Studio Build Tools manually.

### Step 3: Install hnswlib-node

Navigate to your project directory and install:

```powershell
cd C:\Users\p5_pa\axerey
npm install hnswlib-node
```

If you encounter errors, try:

```powershell
# Clean install
npm cache clean --force
rm -r -fo node_modules
rm package-lock.json
npm install
```

### Step 4: Verify Installation

Create a test file to verify `hnswlib-node` works:

```powershell
# Create test file
@"
const HNSWLib = require('hnswlib-node');

const numDimensions = 8;
const maxElements = 10;

const index = new HNSWLib.HierarchicalNSW('l2', numDimensions);
index.initIndex(maxElements);

for (let i = 0; i < maxElements; i++) {
  const point = Array.from({ length: numDimensions }, () => Math.random());
  index.addPoint(point, i);
}

console.log('✅ hnswlib-node is working correctly!');
console.log('Index contains', index.getCurrentCount(), 'points');
"@ | Out-File -FilePath test-hnswlib.js -Encoding utf8

# Run test
node test-hnswlib.js
```

If successful, you should see:
```
✅ hnswlib-node is working correctly!
Index contains 10 points
```

## Troubleshooting

### Error: "node-gyp rebuild" failed

**Solution 1**: Ensure Visual Studio Build Tools are installed correctly
```powershell
# Check if MSBuild is available
& "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe" /version
```

**Solution 2**: Set environment variables
```powershell
# Set Visual Studio path (adjust version if needed)
$env:GYP_MSVS_VERSION = "2022"
$env:VCTargetsPath = "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\Common7\IDE\VC\VCTargets"

# Then try installing again
npm install hnswlib-node
```

### Error: "Python not found"

**Solution**: Ensure Python is in PATH
```powershell
# Check Python
python --version

# If not found, add Python to PATH manually:
# 1. Search "Environment Variables" in Windows
# 2. Edit "Path" variable
# 3. Add: C:\Users\YourUsername\AppData\Local\Programs\Python\Python3XX
# 4. Restart PowerShell
```

### Error: "MSBuild.exe not found"

**Solution**: Install Visual Studio Build Tools with C++ workload
- Re-run Visual Studio Installer
- Modify installation
- Ensure "Desktop development with C++" is checked

### Error: "Access denied" or Permission Issues

**Solution**: Run PowerShell as Administrator
```powershell
# Right-click PowerShell → Run as Administrator
# Then retry installation
npm install hnswlib-node
```

### Error: "Cannot find module 'hnswlib-node'"

**Solution**: Rebuild native modules
```powershell
npm rebuild hnswlib-node
```

## Alternative: Using Pre-built Binaries

If compilation continues to fail, you can try:

```powershell
# Use npm with build-from-source flag disabled (if available)
npm install hnswlib-node --build-from-source=false

# Or try installing specific version
npm install hnswlib-node@3.0.0
```

## Verification in Your Project

After successful installation, test it in your project:

```powershell
# Build your TypeScript project
npm run build

# Test the HNSW search provider
node -e "import('./dist/providers/hnsw-search.js').then(m => console.log('✅ HNSW module loaded'))"
```

## Environment Setup Summary

After completing setup, you should have:

1. ✅ Visual Studio Build Tools with C++ workload
2. ✅ Python 3.x in PATH
3. ✅ npm configured for Windows builds
4. ✅ hnswlib-node installed and working

## Quick Check Script

Run this to verify everything is set up:

```powershell
Write-Host "Checking prerequisites..." -ForegroundColor Cyan

# Check Node.js
Write-Host "`nNode.js:" -ForegroundColor Yellow
node --version

# Check npm
Write-Host "`nnpm:" -ForegroundColor Yellow
npm --version

# Check Python
Write-Host "`nPython:" -ForegroundColor Yellow
python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found in PATH!" -ForegroundColor Red
} else {
    Write-Host "✅ Python found" -ForegroundColor Green
}

# Check MSBuild
Write-Host "`nMSBuild:" -ForegroundColor Yellow
$msbuild = "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
if (Test-Path $msbuild) {
    Write-Host "✅ MSBuild found" -ForegroundColor Green
} else {
    Write-Host "❌ MSBuild not found. Install Visual Studio Build Tools!" -ForegroundColor Red
}

# Check hnswlib-node
Write-Host "`nhnswlib-node:" -ForegroundColor Yellow
if (Test-Path "node_modules\hnswlib-node") {
    Write-Host "✅ hnswlib-node installed" -ForegroundColor Green
} else {
    Write-Host "❌ hnswlib-node not installed" -ForegroundColor Red
}
```

Save this as `check-setup.ps1` and run:
```powershell
.\check-setup.ps1
```

## Next Steps

Once `hnswlib-node` is installed:

1. **Build your project**: `npm run build`
2. **Test HNSW search**: The system will automatically use HNSW when available
3. **Check VSS status**: Run `npm run test-vss` to verify vector search is working

## Additional Resources

- [hnswlib-node Documentation](https://yoshoku.github.io/hnswlib-node/doc/index.html)
- [node-gyp Windows Setup](https://github.com/nodejs/node-gyp#on-windows)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

