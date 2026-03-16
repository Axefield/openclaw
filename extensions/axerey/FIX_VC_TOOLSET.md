# Fix: Missing VC++ Toolset Error

## The Problem

You're seeing this error:
```
gyp ERR! find VS - found "Visual Studio C++ core features"
gyp ERR! find VS - missing any VC++ toolset
```

This means **Visual Studio Build Tools is installed**, but the **C++ compiler toolset is missing**.

## The Solution

You need to install the **"Desktop development with C++"** workload in Visual Studio Build Tools.

### Step-by-Step Instructions

1. **Open Visual Studio Installer**
   - Press `Win + R`, type `appwiz.cpl`, press Enter
   - Or search for "Visual Studio Installer" in Start Menu

2. **Find Visual Studio 2022 Build Tools**
   - Look for "Visual Studio 2022 Build Tools"
   - Click **"Modify"** button

3. **Select the C++ Workload**
   - In the workloads tab, check **"Desktop development with C++"**
   - This will automatically select required components

4. **Verify Required Components**
   Make sure these are selected (they should auto-select):
   - ✅ **MSVC v143 - VS 2022 C++ x64/x86 build tools** (REQUIRED)
   - ✅ **Windows 10/11 SDK** (latest version) (REQUIRED)
   - ✅ **C++ CMake tools for Windows** (optional but recommended)

5. **Install**
   - Click **"Modify"** button at bottom right
   - Wait for installation to complete (this may take 10-30 minutes)

6. **Verify Installation**
   After installation completes, run:
   ```powershell
   .\check-vc-toolset.ps1
   ```

7. **Try Installing Again**
   ```powershell
   .\setup-msbuild.ps1
   npm install hnswlib-node
   ```

## Quick Diagnostic

Run this to check what's missing:

```powershell
.\check-vc-toolset.ps1
```

This will tell you exactly what components are missing.

## Alternative: Install via Command Line

If you prefer command line, you can use:

```powershell
# Download Visual Studio Installer bootstrapper
$vsInstaller = "$env:TEMP\vs_buildtools.exe"
Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" -OutFile $vsInstaller

# Install with C++ workload (silent install)
& $vsInstaller --quiet --wait --norestart --nocache `
  --add Microsoft.VisualStudio.Workload.VCTools `
  --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
  --add Microsoft.VisualStudio.Component.Windows11SDK.22621
```

## What This Installs

The "Desktop development with C++" workload includes:

- **MSVC Compiler** (`cl.exe`) - Required to compile C++ code
- **Windows SDK** - Required for Windows API headers
- **Build Tools** - MSBuild, linker, etc.
- **C++ Runtime Libraries** - Required for running compiled code

Without these, node-gyp cannot compile native Node.js modules like `hnswlib-node`.

## After Installation

Once the C++ workload is installed:

1. **Close and reopen your terminal** (to refresh environment)
2. **Run setup script**: `.\setup-msbuild.ps1`
3. **Install package**: `npm install hnswlib-node`

The installation should now succeed!

