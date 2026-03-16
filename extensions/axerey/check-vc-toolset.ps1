# Check if VC++ Toolset is installed
# This script diagnoses why node-gyp says "missing any VC++ toolset"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  VC++ Toolset Diagnostic Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$vsRoot = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"
$allGood = $true

# Check 1: VC Tools directory
Write-Host "`n[1/4] Checking VC Tools directory..." -ForegroundColor Yellow
$vcToolsPath = Join-Path $vsRoot "VC\Tools\MSVC"
if (Test-Path $vcToolsPath) {
    Write-Host "  [OK] VC Tools directory found: $vcToolsPath" -ForegroundColor Green
    
    $vcVersions = Get-ChildItem $vcToolsPath -Directory -ErrorAction SilentlyContinue
    if ($vcVersions) {
        Write-Host "  [OK] Found VC++ toolset versions:" -ForegroundColor Green
        foreach ($version in $vcVersions) {
            Write-Host "       - $($version.Name)" -ForegroundColor Gray
        }
        
        # Check for compiler
        $latestVC = $vcVersions[0].FullName
        $clExe = Join-Path $latestVC "bin\Hostx64\x64\cl.exe"
        if (Test-Path $clExe) {
            Write-Host "  [OK] C++ compiler (cl.exe) found: $clExe" -ForegroundColor Green
        } else {
            Write-Host "  [ERROR] C++ compiler (cl.exe) NOT found!" -ForegroundColor Red
            Write-Host "          Expected at: $clExe" -ForegroundColor Yellow
            $allGood = $false
        }
    } else {
        Write-Host "  [ERROR] No VC++ toolset versions found!" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "  [ERROR] VC Tools directory NOT found!" -ForegroundColor Red
    Write-Host "          Expected at: $vcToolsPath" -ForegroundColor Yellow
    $allGood = $false
}

# Check 2: Windows SDK
Write-Host "`n[2/4] Checking Windows SDK..." -ForegroundColor Yellow
$sdkPath = "C:\Program Files (x86)\Windows Kits\10"
if (Test-Path $sdkPath) {
    Write-Host "  [OK] Windows SDK directory found" -ForegroundColor Green
} else {
    Write-Host "  [WARN] Windows SDK directory not found" -ForegroundColor Yellow
    Write-Host "         This may cause issues, but is not critical" -ForegroundColor Gray
}

# Check 3: VCTargetsPath
Write-Host "`n[3/4] Checking VCTargetsPath..." -ForegroundColor Yellow
$vctargetsPath = Join-Path $vsRoot "Common7\IDE\VC\VCTargets"
if (Test-Path $vctargetsPath) {
    Write-Host "  [OK] VCTargetsPath found: $vctargetsPath" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] VCTargetsPath NOT found!" -ForegroundColor Red
    Write-Host "          Expected at: $vctargetsPath" -ForegroundColor Yellow
    $allGood = $false
}

# Check 4: MSBuild
Write-Host "`n[4/4] Checking MSBuild..." -ForegroundColor Yellow
$msbuildExe = Join-Path $vsRoot "MSBuild\Current\Bin\MSBuild.exe"
if (Test-Path $msbuildExe) {
    Write-Host "  [OK] MSBuild found: $msbuildExe" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] MSBuild NOT found!" -ForegroundColor Red
    $allGood = $false
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "[OK] All VC++ components are installed!" -ForegroundColor Green
    Write-Host "`nYou should be able to build native modules now." -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] VC++ toolset is missing or incomplete!" -ForegroundColor Red
    Write-Host "`nSOLUTION:" -ForegroundColor Yellow
    Write-Host "1. Open Visual Studio Installer" -ForegroundColor White
    Write-Host "2. Click 'Modify' on Visual Studio 2022 Build Tools" -ForegroundColor White
    Write-Host "3. Check 'Desktop development with C++' workload" -ForegroundColor White
    Write-Host "4. Ensure these components are selected:" -ForegroundColor White
    Write-Host "   - MSVC v143 - VS 2022 C++ x64/x86 build tools" -ForegroundColor Gray
    Write-Host "   - Windows 10/11 SDK (latest version)" -ForegroundColor Gray
    Write-Host "   - C++ CMake tools for Windows" -ForegroundColor Gray
    Write-Host "5. Click 'Modify' to install" -ForegroundColor White
    Write-Host "6. After installation, run this script again to verify" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Cyan

