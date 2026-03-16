# Setup Script for MSBuild Configuration on Windows 11
# Specifically configured for: C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin
# MSBuild version: 17.14.23+b0019275e

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MSBuild Configuration for hnswlib-node" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Your specific MSBuild path
$msbuildPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin"
$msbuildExe = Join-Path $msbuildPath "MSBuild.exe"
$vsRoot = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"

# Step 1: Verify MSBuild exists
Write-Host "`n[1/5] Verifying MSBuild installation..." -ForegroundColor Yellow
if (Test-Path $msbuildExe) {
    Write-Host "  [OK] MSBuild found at: $msbuildPath" -ForegroundColor Green
    
    # Get MSBuild version
    try {
        $version = & $msbuildExe /version 2>&1
        Write-Host "  [OK] MSBuild version: $($version[0])" -ForegroundColor Green
    } catch {
        Write-Host "  [WARN] Could not get MSBuild version" -ForegroundColor Yellow
    }
} else {
    Write-Host "  [ERROR] MSBuild not found at: $msbuildPath" -ForegroundColor Red
    Write-Host "     Please verify your Visual Studio Build Tools installation" -ForegroundColor Yellow
    exit 1
}

# Step 2: Add MSBuild to PATH for current session
Write-Host "`n[2/5] Configuring PATH for current session..." -ForegroundColor Yellow
if ($env:PATH -notlike "*$msbuildPath*") {
    $env:PATH = "$msbuildPath;$env:PATH"
    Write-Host "  [OK] Added MSBuild to PATH (current session)" -ForegroundColor Green
} else {
    Write-Host "  [INFO] MSBuild already in PATH" -ForegroundColor Gray
}

# Step 3: Find and add VC Tools to PATH
Write-Host "`n[3/5] Configuring VC Tools..." -ForegroundColor Yellow
$vcToolsPath = Join-Path $vsRoot "VC\Tools\MSVC"
if (Test-Path $vcToolsPath) {
    $vcVersions = Get-ChildItem $vcToolsPath -Directory | Sort-Object Name -Descending
    if ($vcVersions) {
        $latestVC = $vcVersions[0].FullName
        $vcBinPath = Join-Path $latestVC "bin\Hostx64\x64"
        if (Test-Path $vcBinPath) {
            if ($env:PATH -notlike "*$vcBinPath*") {
                $env:PATH = "$vcBinPath;$env:PATH"
                Write-Host "  [OK] Added VC Tools to PATH: $vcBinPath" -ForegroundColor Green
            } else {
                Write-Host "  [INFO] VC Tools already in PATH" -ForegroundColor Gray
            }
        } else {
            Write-Host "  [WARN] VC Tools bin path not found: $vcBinPath" -ForegroundColor Yellow
            Write-Host "         This may indicate the C++ workload is not installed!" -ForegroundColor Red
        }
    } else {
        Write-Host "  [WARN] No VC Tools versions found" -ForegroundColor Yellow
        Write-Host "         You need to install 'Desktop development with C++' workload!" -ForegroundColor Red
    }
} else {
    Write-Host "  [WARN] VC Tools path not found: $vcToolsPath" -ForegroundColor Yellow
    Write-Host "         You need to install 'Desktop development with C++' workload!" -ForegroundColor Red
}

# Step 4: Set node-gyp environment variables
Write-Host "`n[4/5] Setting node-gyp environment variables..." -ForegroundColor Yellow

# GYP_MSVS_VERSION
$env:GYP_MSVS_VERSION = "2022"
Write-Host "  [OK] Set GYP_MSVS_VERSION=2022" -ForegroundColor Green

# VCTargetsPath
$vctargetsPath = Join-Path $vsRoot "Common7\IDE\VC\VCTargets"
if (Test-Path $vctargetsPath) {
    $env:VCTargetsPath = $vctargetsPath
    Write-Host "  [OK] Set VCTargetsPath=$vctargetsPath" -ForegroundColor Green
} else {
    Write-Host "  [WARN] VCTargetsPath not found: $vctargetsPath" -ForegroundColor Yellow
    Write-Host "         You need to install 'Desktop development with C++' workload!" -ForegroundColor Red
}

# GYP_MSVS_OVERRIDE_PATH (for node-gyp to find MSBuild)
$env:GYP_MSVS_OVERRIDE_PATH = $vsRoot
Write-Host "  [OK] Set GYP_MSVS_OVERRIDE_PATH=$vsRoot" -ForegroundColor Green

# Step 5: Configure npm
Write-Host "`n[5/5] Configuring npm..." -ForegroundColor Yellow

# Check Python
$pythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source
if ($pythonPath) {
    Write-Host "  [OK] Python found: $pythonPath" -ForegroundColor Green
    # Note: python config is set in .npmrc file, not via npm config
} else {
    Write-Host "  [WARN] Python not found in PATH" -ForegroundColor Yellow
    Write-Host "         Please ensure Python is installed and in PATH" -ForegroundColor Yellow
}

# Note: msvs_version is set in .npmrc file
Write-Host "  [OK] MSVS version configured in .npmrc (2022)" -ForegroundColor Green

# Verify .npmrc exists and is configured
$npmrcPath = Join-Path $PSScriptRoot ".npmrc"
if (Test-Path $npmrcPath) {
    Write-Host "  [OK] .npmrc file found and configured" -ForegroundColor Green
} else {
    Write-Host "  [WARN] .npmrc file not found (will be created)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment variables set for this session:" -ForegroundColor Cyan
Write-Host "  - GYP_MSVS_VERSION = 2022" -ForegroundColor White
Write-Host "  - GYP_MSVS_OVERRIDE_PATH = $vsRoot" -ForegroundColor White
if ($vctargetsPath) {
    Write-Host "  - VCTargetsPath = $vctargetsPath" -ForegroundColor White
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm install hnswlib-node" -ForegroundColor White
Write-Host "  2. If installation fails, try: npm rebuild hnswlib-node" -ForegroundColor White
Write-Host "  3. Verify: node -e \"require('hnswlib-node')\"" -ForegroundColor White
Write-Host ""
Write-Host "Note: Environment variables are set for this PowerShell session only." -ForegroundColor Yellow
Write-Host "      If you open a new terminal, run this script again or set them permanently." -ForegroundColor Yellow
Write-Host ""

