# User Sync API Guide

This guide explains how to sync users from your parent domain to the Axerey subdomain application.

## Overview

The sync API allows your parent domain to:
- Create/update users in the Axerey application
- Deactivate users when they're removed from parent domain
- Query user status by external ID
- Batch sync multiple users

## Authentication

Sync requests require authentication using a shared secret key.

### Setup

1. **Set the sync secret** in your backend `.env` file:
```env
SYNC_SECRET=your-super-secret-sync-key-here
```

2. **Use the secret** in your parent domain when making sync requests:
```bash
Authorization: Bearer <your-sync-secret>
```

## API Endpoints

### Base URL
```
http://ar.yourdomain.com/api/sync
```
or locally:
```
http://localhost:3122/api/sync
```

### 1. Sync Single User

**POST** `/api/sync/user`

Creates a new user or updates an existing one based on `externalId`.

**Request:**
```json
{
  "externalId": "user_12345",
  "username": "johndoe",
  "email": "john@example.com",
  "role": "user",
  "isActive": true,
  "metadata": {
    "subscription": "premium",
    "signupDate": "2024-01-15"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "abc123...",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user",
      "isActive": true,
      "externalId": "user_12345",
      "externalSource": "parent-domain",
      "createdAt": 1705276800000,
      "updatedAt": 1705276800000
    },
    "created": true,
    "message": "User created"
  }
}
```

### 2. Sync Multiple Users (Batch)

**POST** `/api/sync/users`

Syncs multiple users in a single request.

**Request:**
```json
[
  {
    "externalId": "user_12345",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user"
  },
  {
    "externalId": "user_67890",
    "username": "janedoe",
    "email": "jane@example.com",
    "role": "admin"
  }
]
```

**Response:**
```json
{
  "success": true,
  "data": {
    "created": 2,
    "updated": 0,
    "total": 2,
    "errors": []
  }
}
```

### 3. Get User by External ID

**GET** `/api/sync/user/:externalId`

Retrieves a user by their external ID from the parent domain.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "abc123...",
    "username": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "isActive": true,
    "externalId": "user_12345",
    "externalSource": "parent-domain"
  }
}
```

### 4. Deactivate User

**POST** `/api/sync/user/:externalId/deactivate`

Soft-deletes a user (sets `isActive` to false) when they're removed from the parent domain.

**Response:**
```json
{
  "success": true,
  "message": "User deactivated successfully"
}
```

### 5. Health Check

**GET** `/api/sync/health`

Checks if the sync endpoint is operational.

## Integration Examples

### PHP (Parent Domain)

```php
<?php
function syncUserToAxerey($userData) {
    $syncSecret = getenv('AXEREY_SYNC_SECRET');
    $axereyUrl = 'https://ar.yourdomain.com/api/sync/user';
    
    $ch = curl_init($axereyUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $syncSecret
    ]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($userData));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return json_decode($response, true);
}

// When user signs up on parent domain
$userData = [
    'externalId' => $user->id,
    'username' => $user->username,
    'email' => $user->email,
    'role' => 'user',
    'isActive' => true
];

$result = syncUserToAxerey($userData);
?>
```

### Node.js (Parent Domain)

```javascript
const axios = require('axios');

async function syncUserToAxerey(userData) {
  const syncSecret = process.env.AXEREY_SYNC_SECRET;
  const axereyUrl = 'https://ar.yourdomain.com/api/sync/user';
  
  try {
    const response = await axios.post(axereyUrl, userData, {
      headers: {
        'Authorization': `Bearer ${syncSecret}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Sync failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
syncUserToAxerey({
  externalId: user.id,
  username: user.username,
  email: user.email,
  role: 'user',
  isActive: true
});
```

### Python (Parent Domain)

```python
import requests
import os

def sync_user_to_axerey(user_data):
    sync_secret = os.getenv('AXEREY_SYNC_SECRET')
    axerey_url = 'https://ar.yourdomain.com/api/sync/user'
    
    headers = {
        'Authorization': f'Bearer {sync_secret}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(axerey_url, json=user_data, headers=headers)
    response.raise_for_status()
    return response.json()

# Usage
result = sync_user_to_axerey({
    'externalId': user.id,
    'username': user.username,
    'email': user.email,
    'role': 'user',
    'isActive': True
})
```

## Webhook Integration

You can set up webhooks in your parent domain to automatically sync users:

### On User Registration
```javascript
// Parent domain webhook handler
app.post('/webhooks/user-created', async (req, res) => {
  const user = req.body;
  
  await syncUserToAxerey({
    externalId: user.id,
    username: user.username,
    email: user.email,
    role: 'user',
    isActive: true
  });
  
  res.json({ success: true });
});
```

### On User Update
```javascript
app.post('/webhooks/user-updated', async (req, res) => {
  const user = req.body;
  
  await syncUserToAxerey({
    externalId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    isActive: user.isActive
  });
  
  res.json({ success: true });
});
```

### On User Deletion
```javascript
app.post('/webhooks/user-deleted', async (req, res) => {
  const { userId } = req.body;
  
  await deactivateUserInAxerey(userId);
  
  res.json({ success: true });
});
```

## Security Best Practices

1. **Use HTTPS**: Always use HTTPS for sync requests in production
2. **Rotate Secrets**: Regularly rotate your `SYNC_SECRET`
3. **Rate Limiting**: Implement rate limiting on sync endpoints
4. **IP Whitelisting**: Consider whitelisting parent domain IPs
5. **Logging**: Monitor sync requests for suspicious activity

## Error Handling

The API returns standard error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "details": [] // For validation errors
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Validation error
- `401` - Authentication failed
- `404` - User not found
- `500` - Server error

## Testing

Test the sync endpoint locally:

```bash
# Set sync secret
export SYNC_SECRET=test-secret-123

# Test sync user
curl -X POST http://localhost:3122/api/sync/user \
  -H "Authorization: Bearer test-secret-123" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "test_user_1",
    "username": "testuser",
    "email": "test@example.com",
    "role": "user"
  }'
```

## Next Steps

1. Set `SYNC_SECRET` in your backend `.env`
2. Implement sync calls in your parent domain
3. Set up webhooks for automatic syncing
4. Test the integration
5. Monitor sync logs for issues

