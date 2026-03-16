# Complete Setup Script: Install and Configure Visual Studio Build Tools
# Run as Administrator for full functionality

param(
    [switch]$AutoInstall
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Visual Studio Build Tools Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check for admin privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`n⚠️  Administrator privileges recommended for PATH configuration" -ForegroundColor Yellow
    Write-Host "   (Some features will work without admin)" -ForegroundColor Gray
}

# Function to add to PATH
function Add-ToPath {
    param(
        [string]$PathToAdd,
        [string]$Scope = "User"
    )
    
    if ($Scope -eq "Machine" -and -not $isAdmin) {
        Write-Host "  ⚠️  Skipping system PATH (requires admin)" -ForegroundColor Yellow
        $Scope = "User"
    }
    
    $currentPath = [Environment]::GetEnvironmentVariable("Path", $Scope)
    if ($currentPath -notlike "*$PathToAdd*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$PathToAdd", $Scope)
        Write-Host "  ✅ Added to PATH ($Scope): $PathToAdd" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ℹ️  Already in PATH: $PathToAdd" -ForegroundColor Gray
        return $false
    }
}

# Step 1: Check for existing installation
Write-Host "`n[1/4] Checking for existing Visual Studio Build Tools..." -ForegroundColor Yellow

$vsPaths = @(
    "C:\Program Files\Microsoft Visual Studio\2022\BuildTools",
    "C:\Program Files\Microsoft Visual Studio\2022\Community",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional",
    "C:\Program Files\Microsoft Visual Studio\2022\Enterprise"
)

$foundVS = $null
$msbuildPath = $null

foreach ($vsPath in $vsPaths) {
    if (Test-Path $vsPath) {
        $msbuild = Join-Path $vsPath "MSBuild\Current\Bin\MSBuild.exe"
        if (Test-Path $msbuild) {
            $foundVS = $vsPath
            $msbuildPath = Split-Path $msbuild -Parent
            Write-Host "  ✅ Found: $vsPath" -ForegroundColor Green
            break
        }
    }
}

# Step 2: Install if not found
if (-not $foundVS) {
    Write-Host "`n[2/4] Visual Studio Build Tools not found" -ForegroundColor Yellow
    
    if ($AutoInstall -and $isAdmin) {
        Write-Host "  Attempting automatic installation..." -ForegroundColor Cyan
        
        # Check for Chocolatey
        $chocoAvailable = Get-Command choco -ErrorAction SilentlyContinue
        if ($chocoAvailable) {
            Write-Host "  Using Chocolatey to install..." -ForegroundColor Cyan
            choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended" -y
        } else {
            Write-Host "  Chocolatey not available. Manual installation required." -ForegroundColor Yellow
            $AutoInstall = $false
        }
    }
    
    if (-not $AutoInstall) {
        Write-Host "`n  Manual Installation Required:" -ForegroundColor Yellow
        Write-Host "    1. Download Visual Studio Build Tools 2022" -ForegroundColor White
        Write-Host "       URL: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022" -ForegroundColor Cyan
        Write-Host "    2. Run the installer" -ForegroundColor White
        Write-Host "    3. Select 'Desktop development with C++' workload" -ForegroundColor White
        Write-Host "    4. Click Install" -ForegroundColor White
        Write-Host "    5. Run this script again after installation" -ForegroundColor White
        
        $openBrowser = Read-Host "`n  Open download page now? (Y/N)"
        if ($openBrowser -eq 'Y' -or $openBrowser -eq 'y') {
            Start-Process "https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022"
        }
        
        Write-Host "`n  Waiting for installation..." -ForegroundColor Yellow
        Write-Host "  (Press any key after installation completes)" -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        
        # Re-check after manual installation
        foreach ($vsPath in $vsPaths) {
            if (Test-Path $vsPath) {
                $msbuild = Join-Path $vsPath "MSBuild\Current\Bin\MSBuild.exe"
                if (Test-Path $msbuild) {
                    $foundVS = $vsPath
                    $msbuildPath = Split-Path $msbuild -Parent
                    Write-Host "  ✅ Found after installation: $vsPath" -ForegroundColor Green
                    break
                }
            }
        }
    }
}

# Step 3: Configure PATH
if ($foundVS) {
    Write-Host "`n[3/4] Configuring PATH..." -ForegroundColor Yellow
    
    # Add MSBuild to PATH
    if ($msbuildPath) {
        Add-ToPath $msbuildPath "User"
        # Also add to current session
        if ($env:PATH -notlike "*$msbuildPath*") {
            $env:PATH = "$msbuildPath;$env:PATH"
        }
    }
    
    # Find and add VC Tools
    $vcToolsPath = Join-Path $foundVS "VC\Tools\MSVC"
    if (Test-Path $vcToolsPath) {
        $vcVersions = Get-ChildItem $vcToolsPath -Directory | Sort-Object Name -Descending
        if ($vcVersions) {
            $latestVC = $vcVersions[0].FullName
            $vcBinPath = Join-Path $latestVC "bin\Hostx64\x64"
            if (Test-Path $vcBinPath) {
                Add-ToPath $vcBinPath "User"
                # Also add to current session
                if ($env:PATH -notlike "*$vcBinPath*") {
                    $env:PATH = "$vcBinPath;$env:PATH"
                }
            }
        }
    }
    
    # Add Windows SDK if available
    $sdkPath = "C:\Program Files (x86)\Windows Kits\10\bin\10.0.*\x64"
    $sdkDirs = Get-ChildItem "C:\Program Files (x86)\Windows Kits\10\bin" -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer } | Sort-Object Name -Descending
    if ($sdkDirs) {
        $latestSDK = $sdkDirs[0].FullName
        $sdkBinPath = Join-Path $latestSDK "x64"
        if (Test-Path $sdkBinPath) {
            Add-ToPath $sdkBinPath "User"
        }
    }
    
} else {
    Write-Host "`n[3/4] Skipping PATH configuration (Build Tools not found)" -ForegroundColor Yellow
}

# Step 4: Set environment variables
Write-Host "`n[4/4] Setting environment variables..." -ForegroundColor Yellow

# Set for current session
$env:GYP_MSVS_VERSION = "2022"
Write-Host "  ✅ GYP_MSVS_VERSION=2022 (current session)" -ForegroundColor Green

if ($foundVS) {
    $vctargetsPath = Join-Path $foundVS "Common7\IDE\VC\VCTargets"
    if (Test-Path $vctargetsPath) {
        $env:VCTargetsPath = $vctargetsPath
        Write-Host "  ✅ VCTargetsPath set (current session)" -ForegroundColor Green
        
        # Set permanently if admin
        if ($isAdmin) {
            [Environment]::SetEnvironmentVariable("VCTargetsPath", $vctargetsPath, "Machine")
            Write-Host "  ✅ VCTargetsPath set permanently" -ForegroundColor Green
        }
    }
    
    # Set permanently if admin
    if ($isAdmin) {
        [Environment]::SetEnvironmentVariable("GYP_MSVS_VERSION", "2022", "Machine")
        Write-Host "  ✅ GYP_MSVS_VERSION set permanently" -ForegroundColor Green
    }
}

# Verify
Write-Host "`nVerifying setup..." -ForegroundColor Yellow
if ($msbuildPath) {
    try {
        $version = & "$msbuildPath\MSBuild.exe" /version 2>&1 | Select-Object -First 1
        Write-Host "  ✅ MSBuild accessible: $version" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  MSBuild verification failed" -ForegroundColor Yellow
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
if ($foundVS) {
    Write-Host "✅ Visual Studio Build Tools are configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Restart your terminal/PowerShell for PATH changes" -ForegroundColor White
    Write-Host "  2. Run: npm install hnswlib-node" -ForegroundColor White
    Write-Host "  3. Run: .\check-setup.ps1 to verify" -ForegroundColor White
} else {
    Write-Host "⚠️  Please install Visual Studio Build Tools first" -ForegroundColor Yellow
    Write-Host "   Then run this script again" -ForegroundColor Yellow
}
Write-Host ""

