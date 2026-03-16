# MSBuild Configuration Guide for hnswlib-node on Windows 11

This guide is specifically configured for your system:
- **MSBuild Location**: `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin`
- **MSBuild Version**: 17.14.23+b0019275e
- **OS**: Windows 11

## Quick Setup (Recommended)

Run the setup script in PowerShell:

```powershell
.\setup-msbuild.ps1
```

This script will:
1. ✅ Verify MSBuild installation
2. ✅ Add MSBuild to PATH (current session)
3. ✅ Configure VC Tools
4. ✅ Set node-gyp environment variables
5. ✅ Configure npm settings

After running the script, install hnswlib-node:

```powershell
npm install hnswlib-node
```

## Manual Configuration

If you prefer to configure manually or need permanent settings:

### Step 1: Set Environment Variables (Current Session)

Run these commands in PowerShell:

```powershell
# Set Visual Studio root path
$env:GYP_MSVS_OVERRIDE_PATH = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"

# Set MSVS version
$env:GYP_MSVS_VERSION = "2022"

# Set VCTargetsPath
$env:VCTargetsPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\IDE\VC\VCTargets"

# Add MSBuild to PATH
$msbuildPath = "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin"
$env:PATH = "$msbuildPath;$env:PATH"
```

### Step 2: Configure npm

```powershell
npm config set msvs_version 2022
npm config set python python3
```

### Step 3: Install hnswlib-node

```powershell
npm install hnswlib-node
```

## Permanent Environment Variables (Optional)

To make environment variables permanent (survive terminal restarts):

1. Open **System Properties** → **Environment Variables**
2. Under **User variables** or **System variables**, click **New**
3. Add these variables:

| Variable Name | Variable Value |
|--------------|----------------|
| `GYP_MSVS_VERSION` | `2022` |
| `GYP_MSVS_OVERRIDE_PATH` | `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools` |
| `VCTargetsPath` | `C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\Common7\IDE\VC\VCTargets` |

4. Edit the **Path** variable and add:
   ```
   C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin
   ```

5. **Restart your terminal** for changes to take effect

## Verification

After configuration, verify everything works:

```powershell
# Check MSBuild
& "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe" /version

# Check npm configuration
npm config list

# Check environment variables
$env:GYP_MSVS_VERSION
$env:GYP_MSVS_OVERRIDE_PATH

# Verify hnswlib-node installation
node -e "require('hnswlib-node'); console.log('✅ hnswlib-node loaded successfully')"
```

## Troubleshooting

### Error: "MSBuild.exe not found"

**Solution**: Ensure the path is correct:
```powershell
Test-Path "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
```

If this returns `False`, your Visual Studio Build Tools may be installed in a different location. Check:
- `C:\Program Files\Microsoft Visual Studio\2022\BuildTools\`
- `C:\Program Files (x86)\Microsoft Visual Studio\2022\Community\`

### Error: "node-gyp rebuild failed"

**Solution 1**: Run the setup script again:
```powershell
.\setup-msbuild.ps1
npm rebuild hnswlib-node
```

**Solution 2**: Check Python is installed:
```powershell
python --version
```

**Solution 3**: Clean and reinstall:
```powershell
npm cache clean --force
Remove-Item -Recurse -Force node_modules\hnswlib-node
npm install hnswlib-node
```

### Error: "Cannot find module 'hnswlib-node'"

**Solution**: Rebuild the native module:
```powershell
npm rebuild hnswlib-node
```

### Environment Variables Not Persisting

**Solution**: Set them permanently using System Properties (see "Permanent Environment Variables" above) or run `setup-msbuild.ps1` each time you open a new terminal.

## How It Works

1. **node-gyp** is the build tool that compiles native Node.js modules
2. **MSBuild** is Microsoft's build engine (part of Visual Studio)
3. **hnswlib-node** is a native C++ module that requires compilation
4. **Environment variables** tell node-gyp where to find MSBuild and Visual Studio tools

The `.npmrc` file configures npm/node-gyp settings, while environment variables provide runtime paths.

## Files Created

- `.npmrc` - npm configuration for MSVS version and Python
- `setup-msbuild.ps1` - Automated setup script for your system
- `MSBUILD_SETUP_GUIDE.md` - This guide

## Next Steps

After successful installation:

1. **Build your project**: `npm run build`
2. **Test hnswlib-node**: The system will automatically use HNSW when available
3. **Check VSS status**: Run `npm run test-vss` to verify vector search is working

## Additional Resources

- [node-gyp Windows Setup](https://github.com/nodejs/node-gyp#on-windows)
- [hnswlib-node Documentation](https://yoshoku.github.io/hnswlib-node/doc/index.html)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)

