# Configure Build Tools for hnswlib-node on Windows
# This script sets up environment variables and npm configuration

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configuring Build Tools" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check for Visual Studio installations
Write-Host "`n[1/3] Searching for Visual Studio Build Tools..." -ForegroundColor Yellow

$vsPaths = @(
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools",
    "C:\Program Files\Microsoft Visual Studio\2022\BuildTools",
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\Community",
    "C:\Program Files\Microsoft Visual Studio\2022\Community",
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\Professional",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional",
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\Enterprise",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise"
)

$foundPath = $null
$msbuildPath = $null

foreach ($vsPath in $vsPaths) {
    if (Test-Path $vsPath) {
        $msbuild = Join-Path $vsPath "MSBuild\Current\Bin\MSBuild.exe"
        if (Test-Path $msbuild) {
            $foundPath = $vsPath
            $msbuildPath = Split-Path $msbuild -Parent
            Write-Host "  ✅ Found: $vsPath" -ForegroundColor Green
            break
        }
    }
}

if (-not $foundPath) {
    Write-Host "  ❌ Visual Studio Build Tools not found" -ForegroundColor Red
    Write-Host "`n  Please install Visual Studio Build Tools:" -ForegroundColor Yellow
    Write-Host "    1. Download: https://visualstudio.microsoft.com/downloads/" -ForegroundColor White
    Write-Host "    2. Select 'Build Tools for Visual Studio 2022'" -ForegroundColor White
    Write-Host "    3. During installation, check 'Desktop development with C++'" -ForegroundColor White
    Write-Host "    4. Run this script again after installation" -ForegroundColor White
    
    $install = Read-Host "`nWould you like to open the download page? (Y/N)"
    if ($install -eq 'Y' -or $install -eq 'y') {
        Start-Process "https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022"
    }
    exit 1
}

# Step 2: Add to PATH for current session
Write-Host "`n[2/3] Configuring PATH for current session..." -ForegroundColor Yellow

# Add MSBuild to PATH
if ($msbuildPath -and ($env:PATH -notlike "*$msbuildPath*")) {
    $env:PATH = "$msbuildPath;$env:PATH"
    Write-Host "  ✅ Added MSBuild to PATH (current session)" -ForegroundColor Green
}

# Find and add VC Tools
$vcToolsPath = Join-Path $foundPath "VC\Tools\MSVC"
if (Test-Path $vcToolsPath) {
    $vcVersions = Get-ChildItem $vcToolsPath -Directory | Sort-Object Name -Descending
    if ($vcVersions) {
        $latestVC = $vcVersions[0].FullName
        $vcBinPath = Join-Path $latestVC "bin\Hostx64\x64"
        if (Test-Path $vcBinPath -and ($env:PATH -notlike "*$vcBinPath*")) {
            $env:PATH = "$vcBinPath;$env:PATH"
            Write-Host "  ✅ Added VC Tools to PATH (current session)" -ForegroundColor Green
        }
    }
}

# Step 3: Set environment variables for node-gyp
Write-Host "`n[3/3] Setting node-gyp environment variables..." -ForegroundColor Yellow

# Set GYP_MSVS_VERSION
$env:GYP_MSVS_VERSION = "2022"
Write-Host "  ✅ Set GYP_MSVS_VERSION=2022" -ForegroundColor Green

# Set VCTargetsPath
$vctargetsPath = Join-Path $foundPath "Common7\IDE\VC\VCTargets"
if (Test-Path $vctargetsPath) {
    $env:VCTargetsPath = $vctargetsPath
    Write-Host "  ✅ Set VCTargetsPath" -ForegroundColor Green
}

# Verify MSBuild is accessible
Write-Host "`nVerifying MSBuild..." -ForegroundColor Yellow
try {
    $msbuildVersion = & $msbuildPath\MSBuild.exe /version 2>&1
    Write-Host "  ✅ MSBuild is accessible" -ForegroundColor Green
    Write-Host "     Version: $($msbuildVersion[0])" -ForegroundColor Gray
} catch {
    Write-Host "  ⚠️  Could not verify MSBuild" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment variables are set for this session." -ForegroundColor Cyan
Write-Host "To make them permanent, add to System Environment Variables:" -ForegroundColor Yellow
Write-Host "  - GYP_MSVS_VERSION = 2022" -ForegroundColor White
if ($vctargetsPath) {
    Write-Host "  - VCTargetsPath = $vctargetsPath" -ForegroundColor White
}
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Run: npm install hnswlib-node" -ForegroundColor White
Write-Host "  2. If it fails, you may need to restart your terminal" -ForegroundColor White
Write-Host ""

