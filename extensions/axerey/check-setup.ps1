# Windows Setup Verification Script for hnswlib-node
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  hnswlib-node Setup Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$allGood = $true

# Check Node.js
Write-Host "`n[1/5] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  ✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Node.js not found!" -ForegroundColor Red
    $allGood = $false
}

# Check npm
Write-Host "`n[2/5] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  ✅ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ npm not found!" -ForegroundColor Red
    $allGood = $false
}

# Check Python
Write-Host "`n[3/5] Checking Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Python: $pythonVersion" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Python not found in PATH!" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "  ❌ Python not found!" -ForegroundColor Red
    $allGood = $false
}

# Check Visual Studio Build Tools
Write-Host "`n[4/5] Checking Visual Studio Build Tools..." -ForegroundColor Yellow
$msbuildPaths = @(
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe",
    "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe",
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe",
    "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe",
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe",
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\Enterprise\MSBuild\Current\Bin\MSBuild.exe",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise\MSBuild\Current\Bin\MSBuild.exe",
    "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe",
    "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\MSBuild\Current\Bin\MSBuild.exe"
)

$msbuildFound = $false
foreach ($path in $msbuildPaths) {
    if (Test-Path $path) {
        Write-Host "  ✅ MSBuild found: $path" -ForegroundColor Green
        $msbuildFound = $true
        break
    }
}

if (-not $msbuildFound) {
    Write-Host "  ❌ MSBuild not found!" -ForegroundColor Red
    Write-Host "     Please install Visual Studio Build Tools with C++ workload" -ForegroundColor Yellow
    Write-Host "     Download: https://visualstudio.microsoft.com/downloads/" -ForegroundColor Yellow
    $allGood = $false
}

# Check hnswlib-node installation
Write-Host "`n[5/5] Checking hnswlib-node..." -ForegroundColor Yellow
if (Test-Path "node_modules\hnswlib-node") {
    Write-Host "  ✅ hnswlib-node package found" -ForegroundColor Green
    
    # Try to require it
    try {
        $testScript = @"
const HNSWLib = require('hnswlib-node');
console.log('OK');
"@
        $testScript | node 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ hnswlib-node module loads successfully" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  hnswlib-node found but may need rebuilding" -ForegroundColor Yellow
            Write-Host "     Try: npm rebuild hnswlib-node" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ⚠️  hnswlib-node found but may need rebuilding" -ForegroundColor Yellow
        Write-Host "     Try: npm rebuild hnswlib-node" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  hnswlib-node not installed yet" -ForegroundColor Yellow
    Write-Host "     Run: npm install hnswlib-node" -ForegroundColor Yellow
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ All prerequisites are installed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "  1. Run: npm install hnswlib-node" -ForegroundColor White
    Write-Host "  2. Run: npm run build" -ForegroundColor White
    Write-Host "  3. Test: node test-hnswlib.js" -ForegroundColor White
} else {
    Write-Host "❌ Some prerequisites are missing!" -ForegroundColor Red
    Write-Host "`nPlease install the missing components and run this script again." -ForegroundColor Yellow
}
Write-Host "========================================" -ForegroundColor Cyan

