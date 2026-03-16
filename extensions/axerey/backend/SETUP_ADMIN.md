# Admin Setup Guide

This guide will help you set up an admin user and generate API keys for the Axerey backend.

## Prerequisites

1. Install dependencies:
```bash
cd backend
npm install
```

2. Ensure the database file exists (it will be created automatically on first run)

## Setup Steps

### 1. Run the Setup Script

```bash
npm run setup-admin
```

Or directly with ts-node:
```bash
ts-node scripts/setup-admin.ts
```

### 2. Follow the Prompts

The script will ask you for:
- **Username** (default: `admin`)
- **Email** (required)
- **Password** (minimum 8 characters)

### 3. Save Your Credentials

After setup, you'll receive:
- Admin user credentials (username/email)
- **API Key** - for REST API authentication
- **MCP Key** - for MCP protocol authentication

⚠️ **IMPORTANT**: These keys are shown only once! Save them securely.

## Using API Keys

### REST API

Add the API key to your request headers:
```bash
Authorization: Bearer <your-api-key>
```

Example with curl:
```bash
curl -H "Authorization: Bearer axerey_..." http://localhost:3122/api/users/me
```

### MCP Protocol

Use the MCP key in your MCP configuration file (e.g., `.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "axerey": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "PCM_DB": "./pcm.db",
        "MCP_API_KEY": "axerey_..."
      }
    }
  }
}
```

## API Endpoints

### User Management

- `GET /api/users/me` - Get current user info
- `GET /api/users` - List all users (admin only)
- `POST /api/users` - Create new user (admin only)
- `PUT /api/users/:id` - Update user

### API Key Management

- `GET /api/api-keys` - List your API keys
- `POST /api/api-keys` - Create new API key
- `POST /api/api-keys/:id/revoke` - Revoke an API key
- `DELETE /api/api-keys/:id` - Delete an API key

## Security Notes

1. **Password Security**: Use strong passwords (minimum 8 characters, but longer is better)
2. **API Key Storage**: Never commit API keys to version control
3. **Key Rotation**: Regularly rotate your API keys
4. **HTTPS**: In production, always use HTTPS to protect API keys in transit

## Troubleshooting

### "User already exists" Error

If an admin user already exists, you can:
- Use the existing credentials
- Create a new admin user (the script will prompt you)
- Or manually create users via the API after authenticating

### Database Issues

If you encounter database errors:
1. Ensure the `pcm.db` file is writable
2. Check that `better-sqlite3` is properly installed
3. Verify the database path in your environment

### Key Not Working

If your API key doesn't work:
1. Verify the key is correct (check for typos)
2. Ensure the key hasn't been revoked
3. Check if the key has expired
4. Verify the Authorization header format: `Bearer <key>`

## Next Steps

After setup:
1. Test your API key with a simple request
2. Create additional API keys for different services/applications
3. Set up MCP configuration with your MCP key
4. Review and configure user permissions as needed

