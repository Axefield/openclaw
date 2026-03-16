# Troubleshooting Ollama CORS Issues

## Issue: CORS Request Blocked

If you're seeing errors like:
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at http://localhost:3122/api/ollama/models. (Reason: CORS request did not succeed). Status code: (null).
```

## Quick Fixes

### 1. Verify Backend Server is Running

Check if the backend server is running on port 3122:

```bash
# Check if port 3122 is in use
netstat -ano | findstr :3122  # Windows
lsof -i :3122                  # Mac/Linux

# Or test the endpoint directly
curl http://localhost:3122/api/health
```

### 2. Start the Backend Server

If the server isn't running, start it:

```bash
# Option 1: Using the unified server script
node start-unified-server.js

# Option 2: Build and run manually
cd backend
npm run build
node dist/server.js

# Option 3: Development mode (if configured)
npm run dev
```

### 3. Check Server Logs

Look for these messages in the console:
```
🌌 Ouranigon API server running on port 3122
🔗 API available at: http://localhost:3122/api
🌐 CORS enabled for: http://localhost:5173, http://localhost:5174, http://localhost:3000
```

### 4. Verify Frontend API URL

Check that the frontend is pointing to the correct backend URL:

1. Open browser DevTools (F12)
2. Check the Network tab
3. Look for failed requests to `http://localhost:3122/api/ollama/*`
4. Verify the request URL matches your backend

The frontend API service uses:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3122/api'
```

### 5. Test Backend Directly

Test the Ollama endpoints directly:

```bash
# Health check
curl http://localhost:3122/api/ollama/health

# Get models
curl http://localhost:3122/api/ollama/models

# Test with CORS headers
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:3122/api/ollama/models
```

### 6. Check for Port Conflicts

If port 3122 is already in use:

1. Find the process using the port:
   ```bash
   # Windows
   netstat -ano | findstr :3122
   
   # Mac/Linux
   lsof -i :3122
   ```

2. Kill the process or change the port in `backend/src/server.ts`:
   ```typescript
   const PORT = 3122  // Change to another port like 3123
   ```

### 7. Restart Both Servers

1. Stop both frontend and backend servers (Ctrl+C)
2. Start backend first:
   ```bash
   node start-unified-server.js
   ```
3. Wait for backend to fully start (look for the success messages)
4. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### 8. Check Browser Console

Open browser DevTools and check:
- **Console tab**: Look for CORS errors
- **Network tab**: 
  - Check if requests are being made
  - Look at the request headers
  - Check the response status

### 9. Verify CORS Configuration

The backend should have CORS configured in `backend/src/server.ts`:

```typescript
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}))
```

### 10. Check Firewall/Antivirus

Sometimes firewalls or antivirus software can block localhost connections:
- Temporarily disable firewall/antivirus
- Add exceptions for localhost:3122 and localhost:5173

## Common Error Messages

### "CORS request did not succeed" with status (null)
- **Cause**: Server not running or network issue
- **Fix**: Start the backend server

### "Failed to fetch"
- **Cause**: Network error, server down, or CORS misconfiguration
- **Fix**: Check server is running and CORS is configured

### "NetworkError when attempting to fetch resource"
- **Cause**: Connection refused or server not accessible
- **Fix**: Verify server is running on correct port

## Still Having Issues?

1. **Check backend logs** for errors
2. **Verify Ollama is running**: `ollama serve`
3. **Test with Postman/curl** to isolate frontend vs backend issues
4. **Check Node.js version**: Should be 18+ for best compatibility
5. **Clear browser cache** and hard refresh (Ctrl+Shift+R)

## Debug Mode

Enable verbose logging in the backend:

```typescript
// In backend/src/server.ts, add before routes:
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, {
    origin: req.headers.origin,
    headers: req.headers
  })
  next()
})
```

This will show all incoming requests and their CORS headers.

