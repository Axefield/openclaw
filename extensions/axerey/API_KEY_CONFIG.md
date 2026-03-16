# API Key Configuration Guide

After running `npm run setup-admin`, you'll have two API keys:
1. **API Key** - for REST API calls
2. **MCP Key** - for MCP protocol

Here's where to add them:

## 1. MCP Configuration (for MCP Protocol)

Add your **MCP Key** to your MCP configuration file.

### Option A: Claude Desktop Config (if using Claude Desktop)
**File:** `claude_desktop_config.json` (in project root)

```json
{
  "mcpServers": {
    "axerey": {
      "command": "node",
      "args": ["C:/Users/p5_pa/axerey/dist/index.js"],
      "env": { 
        "PCM_DB": "C:/Users/p5_pa/axerey/pcm.db",
        "MCP_API_KEY": "axerey_YOUR_MCP_KEY_HERE"
      }
    }
  }
}
```

### Option B: Cursor MCP Config
**File:** `.cursor/mcp.json` (if it exists, or create it)

```json
{
  "mcpServers": {
    "axerey": {
      "command": "node",
      "args": ["C:/Users/p5_pa/axerey/dist/index.js"],
      "env": { 
        "PCM_DB": "C:/Users/p5_pa/axerey/pcm.db",
        "MCP_API_KEY": "axerey_YOUR_MCP_KEY_HERE"
      }
    }
  }
}
```

**After updating:** Restart Cursor/Claude Desktop for changes to take effect.

## 2. Environment Variables (Optional)

You can also add API keys to environment variables for easier access:

### Root `.env` file (for MCP server)
Create or update `.env` in the project root:

```env
# Database
PCM_DB=./pcm.db

# API Keys (optional - can also be in MCP config)
MCP_API_KEY=axerey_YOUR_MCP_KEY_HERE

# Other existing vars...
OPENAI_API_KEY=your-openai-key
NODE_ENV=production
```

### Backend `.env` file
Create or update `backend/.env`:

```env
# Server
PORT=3122
NODE_ENV=development

# Database
PCM_DB=../pcm.db

# Security
BCRYPT_ROUNDS=12
```

## 3. Using API Keys

### REST API Calls

Use your **API Key** in HTTP requests:

```bash
# Example: Get current user info
curl -H "Authorization: Bearer axerey_YOUR_API_KEY_HERE" \
  http://localhost:3122/api/users/me
```

### In Code/Applications

```javascript
// JavaScript/TypeScript
fetch('http://localhost:3122/api/users/me', {
  headers: {
    'Authorization': `Bearer axerey_YOUR_API_KEY_HERE`
  }
})
```

```python
# Python
import requests

headers = {
    'Authorization': 'Bearer axerey_YOUR_API_KEY_HERE'
}
response = requests.get('http://localhost:3122/api/users/me', headers=headers)
```

## Quick Setup Checklist

- [ ] Run `npm run setup-admin` and save your keys
- [ ] Add MCP key to `claude_desktop_config.json` (or `.cursor/mcp.json`)
- [ ] Restart Cursor/Claude Desktop
- [ ] Test MCP connection
- [ ] Test REST API with: `curl -H "Authorization: Bearer <key>" http://localhost:3122/api/users/me`

## Security Notes

⚠️ **Never commit API keys to git!**

- Add `.env` to `.gitignore`
- Don't commit `claude_desktop_config.json` with real keys (use a template)
- Use environment variables in production
- Rotate keys regularly

## Need to Generate More Keys?

If you need additional API keys:

```bash
# List your keys
curl -H "Authorization: Bearer <your-api-key>" \
  http://localhost:3122/api/api-keys

# Create a new key
curl -X POST \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Key", "type": "api", "scopes": ["*"]}' \
  http://localhost:3122/api/api-keys
```

