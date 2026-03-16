# Install C++ Workload - Required for hnswlib-node

## Current Status

✅ **MSBuild is installed** - Found at: `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin`

❌ **VC++ Toolset is MISSING** - This is required to compile native Node.js modules

## What You Need to Do

You must install the **"Desktop development with C++"** workload in Visual Studio Build Tools.

### Quick Steps

1. **Open Visual Studio Installer**
   - Press `Win` key, type "Visual Studio Installer", press Enter
   - Or search in Start Menu

2. **Modify Build Tools**
   - Find **"Visual Studio 2022 Build Tools"**
   - Click the **"Modify"** button

3. **Select C++ Workload**
   - Go to the **"Workloads"** tab
   - Check **"Desktop development with C++"**
   - This will auto-select required components:
     - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
     - ✅ Windows 10/11 SDK (latest)
     - ✅ C++ CMake tools for Windows

4. **Install**
   - Click **"Modify"** button (bottom right)
   - Wait for installation (10-30 minutes depending on internet speed)

5. **Verify Installation**
   ```powershell
   .\check-vc-toolset.ps1
   ```
   Should show all checks passing.

6. **Install hnswlib-node**
   ```powershell
   .\setup-msbuild.ps1
   npm install hnswlib-node
   ```

## Why This Is Needed

`hnswlib-node` is a **native C++ module** that must be compiled on your system. It requires:
- **C++ Compiler** (`cl.exe`) - to compile C++ code
- **Linker** - to create the final DLL
- **Windows SDK** - for Windows API headers
- **Build Tools** - MSBuild, etc.

Without the C++ workload, node-gyp cannot compile the module and you'll get:
```
gyp ERR! find VS - missing any VC++ toolset
```

## Alternative: Command Line Installation

If you prefer automation, you can install via command line:

```powershell
# Download installer
$installer = "$env:TEMP\vs_buildtools.exe"
Invoke-WebRequest -Uri "https://aka.ms/vs/17/release/vs_buildtools.exe" -OutFile $installer

# Install C++ workload
& $installer --quiet --wait --norestart --nocache `
  --add Microsoft.VisualStudio.Workload.VCTools `
  --add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 `
  --add Microsoft.VisualStudio.Component.Windows11SDK.22621
```

## After Installation

Once the C++ workload is installed:

1. **Close and reopen your terminal** (to refresh environment)
2. **Run setup**: `.\setup-msbuild.ps1`
3. **Install package**: `npm install hnswlib-node`

The installation should now succeed! 🎉

