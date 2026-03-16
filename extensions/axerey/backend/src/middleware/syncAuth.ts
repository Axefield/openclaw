import { Request, Response, NextFunction } from 'express'
import { createHash } from 'crypto'

/**
 * Middleware to authenticate sync requests from parent domain
 * Supports multiple authentication methods:
 * 1. Shared secret key (SYNC_SECRET env var)
 * 2. JWT token from parent domain
 * 3. API key with sync scope
 */
export function authenticateSync(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    const syncSecret = process.env.SYNC_SECRET
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Missing Authorization header for sync'
      })
      return
    }

    // Method 1: Shared secret key
    if (syncSecret) {
      const providedKey = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader

      // Compare hashed keys for security
      const providedHash = createHash('sha256').update(providedKey).digest('hex')
      const expectedHash = createHash('sha256').update(syncSecret).digest('hex')

      if (providedHash === expectedHash) {
        // Add sync context to request
        req.syncContext = {
          method: 'shared-secret',
          source: req.headers['x-sync-source'] as string || 'parent-domain'
        }
        next()
        return
      }
    }

    // Method 2: JWT token (if implemented)
    // You can add JWT verification here if parent domain uses JWT

    // Method 3: API key with sync scope
    // This would use the existing API key validation but check for sync scope
    // For now, we'll require shared secret

    res.status(401).json({
      success: false,
      error: 'Invalid sync authentication'
    })
  } catch (error) {
    console.error('Sync authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      syncContext?: {
        method: string
        source: string
      }
    }
  }
}

