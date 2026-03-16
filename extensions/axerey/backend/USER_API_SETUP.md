# User Management & API Key System

## Overview

The Axerey backend now includes a complete user management and API key system with the following features:

- **User Management**: Create and manage users with admin/user roles
- **API Key Authentication**: Secure API key-based authentication for REST API and MCP protocol
- **Per-User Database Tables**: Each user gets isolated database tables for data privacy
- **Role-Based Access Control**: Admin and user roles with appropriate permissions

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  scopes TEXT NOT NULL,
  last_used_at INTEGER,
  expires_at INTEGER,
  created_at INTEGER NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Per-User Tables

Each user automatically gets their own isolated tables:
- `user_<userId>_memories` - User-specific memories table
- Additional tables can be created per user as needed

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

This will install `bcrypt` for password hashing.

### 2. Run Admin Setup

```bash
npm run setup-admin
```

This interactive script will:
- Create an admin user account
- Generate an API key for REST API
- Generate an MCP key for MCP protocol

**Save the credentials shown - they won't be displayed again!**

### 3. Test Your Setup

```bash
# Test API key authentication
curl -H "Authorization: Bearer <your-api-key>" \
  http://localhost:3122/api/users/me
```

## API Endpoints

### Authentication

All protected endpoints require the `Authorization` header:
```
Authorization: Bearer <api-key>
```

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/users/me` | Get current user info | Yes |
| GET | `/api/users` | List all users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| POST | `/api/users` | Create new user | Admin |
| PUT | `/api/users/:id` | Update user | Self or Admin |

### API Key Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/api-keys` | List your API keys | Yes |
| POST | `/api/api-keys` | Create new API key | Yes |
| POST | `/api/api-keys/:id/revoke` | Revoke API key | Yes |
| DELETE | `/api/api-keys/:id` | Delete API key | Yes |

## API Key Types

### API Keys (`type: 'api'`)
- Used for REST API authentication
- Format: `axerey_<base64url-encoded-key>`
- Sent in `Authorization: Bearer <key>` header

### MCP Keys (`type: 'mcp'`)
- Used for MCP protocol authentication
- Same format as API keys
- Configured in MCP server environment variables

## Per-User Tables

When a user is created, the system automatically creates isolated tables:

### User Memories Table
Each user gets their own `user_<userId>_memories` table with the same schema as the global memories table, ensuring data isolation.

### Creating Custom User Tables

You can create additional per-user tables using the database service:

```typescript
import { getDatabase } from './services/database.js'

const db = getDatabase()

// Create a custom table for a user
db.createUserTable(userId, 'custom_data', `
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL
`)
```

## Security Features

1. **Password Hashing**: Uses bcrypt with configurable rounds (default: 12)
2. **API Key Hashing**: Keys are hashed with SHA-256 before storage
3. **Key Prefixes**: Only first 8 characters stored for display
4. **Expiration Support**: API keys can have expiration dates
5. **Scope Support**: API keys can have restricted scopes
6. **Role-Based Access**: Admin and user roles with appropriate permissions

## Environment Variables

Add to your `.env` file:

```env
# Password hashing rounds (default: 12)
BCRYPT_ROUNDS=12

# Database path (default: ./pcm.db)
PCM_DB=./pcm.db
```

## Example Usage

### Create a User (Admin Only)

```bash
curl -X POST \
  -H "Authorization: Bearer <admin-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "email": "user@example.com",
    "password": "securepassword123",
    "role": "user"
  }' \
  http://localhost:3122/api/users
```

### Create an API Key

```bash
curl -X POST \
  -H "Authorization: Bearer <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App Key",
    "type": "api",
    "scopes": ["*"]
  }' \
  http://localhost:3122/api/api-keys
```

### List Your API Keys

```bash
curl -H "Authorization: Bearer <your-api-key>" \
  http://localhost:3122/api/api-keys
```

## MCP Integration

To use API keys with MCP, add the key to your MCP configuration:

```json
{
  "mcpServers": {
    "axerey": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "PCM_DB": "./pcm.db",
        "MCP_API_KEY": "axerey_<your-mcp-key>"
      }
    }
  }
}
```

The MCP server can then validate requests using the API key.

## Troubleshooting

### "bcrypt module not found"
Run `npm install` in the backend directory.

### "User already exists"
The admin user may already be set up. Check existing users or create a new one.

### "Invalid or expired API key"
- Verify the key is correct
- Check if the key has been revoked
- Ensure the key hasn't expired
- Verify the Authorization header format

### Database locked errors
Ensure only one process is accessing the database at a time.

## Next Steps

1. Run the setup script to create your admin account
2. Generate API keys for your applications
3. Configure MCP with your MCP key
4. Start using the authenticated API endpoints

For detailed setup instructions, see `SETUP_ADMIN.md`.

