# Script to Install Visual Studio Build Tools and Configure PATH
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Visual Studio Build Tools Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "`n⚠️  This script requires Administrator privileges!" -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    Write-Host "`nRight-click PowerShell → Run as Administrator" -ForegroundColor Cyan
    exit 1
}

# Function to add to PATH
function Add-ToPath {
    param([string]$PathToAdd)
    
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$PathToAdd*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$PathToAdd", "Machine")
        Write-Host "  ✅ Added to PATH: $PathToAdd" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ℹ️  Already in PATH: $PathToAdd" -ForegroundColor Gray
        return $false
    }
}

# Check for existing Visual Studio installations
Write-Host "`n[1/4] Checking for existing Visual Studio installations..." -ForegroundColor Yellow

$vsPaths = @(
    "C:\Program Files\Microsoft Visual Studio\2022\BuildTools",
    "C:\Program Files\Microsoft Visual Studio\2022\Community",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise",
    "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools",
    "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community"
)

$foundVS = $null
foreach ($path in $vsPaths) {
    if (Test-Path $path) {
        $msbuildPath = Join-Path $path "MSBuild\Current\Bin\MSBuild.exe"
        if (Test-Path $msbuildPath) {
            $foundVS = $path
            Write-Host "  ✅ Found: $path" -ForegroundColor Green
            break
        }
    }
}

if ($foundVS) {
    Write-Host "`n[2/4] Configuring PATH for existing installation..." -ForegroundColor Yellow
    
    # Add MSBuild to PATH
    $msbuildBin = Join-Path $foundVS "MSBuild\Current\Bin"
    if (Test-Path $msbuildBin) {
        Add-ToPath $msbuildBin
    }
    
    # Add VC tools to PATH
    $vcTools = Join-Path $foundVS "VC\Tools\MSVC"
    if (Test-Path $vcTools) {
        $vcVersions = Get-ChildItem $vcTools -Directory | Sort-Object Name -Descending
        if ($vcVersions) {
            $latestVC = $vcVersions[0].FullName
            $vcBin = Join-Path $latestVC "bin\Hostx64\x64"
            if (Test-Path $vcBin) {
                Add-ToPath $vcBin
            }
        }
    }
    
    Write-Host "`n✅ Visual Studio Build Tools are configured!" -ForegroundColor Green
    Write-Host "`nPlease restart your PowerShell/terminal for PATH changes to take effect." -ForegroundColor Yellow
    
} else {
    Write-Host "  ❌ Visual Studio Build Tools not found" -ForegroundColor Red
    Write-Host "`n[2/4] Installation Options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Download and Install Visual Studio Build Tools (Recommended)" -ForegroundColor Cyan
    Write-Host "  1. Download from: https://visualstudio.microsoft.com/downloads/" -ForegroundColor White
    Write-Host "  2. Select 'Build Tools for Visual Studio 2022'" -ForegroundColor White
    Write-Host "  3. During installation, select 'Desktop development with C++' workload" -ForegroundColor White
    Write-Host "  4. Run this script again after installation" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Use npm windows-build-tools (Alternative)" -ForegroundColor Cyan
    Write-Host "  Run: npm install --global windows-build-tools" -ForegroundColor White
    Write-Host "  Note: This is deprecated but may work" -ForegroundColor Yellow
    Write-Host ""
    
    $choice = Read-Host "Would you like to open the download page now? (Y/N)"
    if ($choice -eq 'Y' -or $choice -eq 'y') {
        Start-Process "https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022"
    }
}

# Configure npm
Write-Host "`n[3/4] Configuring npm for Windows builds..." -ForegroundColor Yellow

# Set Python for npm
$pythonPath = (Get-Command python -ErrorAction SilentlyContinue).Source
if ($pythonPath) {
    npm config set python python3
    Write-Host "  ✅ Configured npm to use Python 3" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  Python not found in PATH" -ForegroundColor Yellow
}

# Set MSVS version
npm config set msvs_version 2022
Write-Host "  ✅ Set MSVS version to 2022" -ForegroundColor Green

# Show npm configuration
Write-Host "`n[4/4] Current npm configuration:" -ForegroundColor Yellow
npm config list | Select-String -Pattern "python|msvs"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Restart your terminal/PowerShell" -ForegroundColor White
Write-Host "  2. Run: .\check-setup.ps1" -ForegroundColor White
Write-Host "  3. Run: npm install hnswlib-node" -ForegroundColor White
Write-Host ""

