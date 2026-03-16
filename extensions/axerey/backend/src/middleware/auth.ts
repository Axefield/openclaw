import { Request, Response, NextFunction } from 'express'
import { authService } from '../services/authService'

// Extend Express Request type to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        username: string
        email: string
        role: 'admin' | 'user'
      }
      apiKey?: {
        id: string
        name: string
        type: 'api' | 'mcp'
        scopes: string[]
      }
    }
  }
}

/**
 * Middleware to authenticate requests using API keys
 */
export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Try to get API key from Authorization header
    const authHeader = req.headers.authorization
    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: 'Missing Authorization header'
      })
      return
    }

    // Support both "Bearer <key>" and direct key format
    const apiKey = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader

    const validation = await authService.validateApiKey(apiKey)
    if (!validation) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired API key'
      })
      return
    }

    // Attach user and API key info to request
    req.user = {
      id: validation.user.id,
      username: validation.user.username,
      email: validation.user.email,
      role: validation.user.role
    }

    req.apiKey = {
      id: validation.apiKey.id,
      name: validation.apiKey.name,
      type: validation.apiKey.type,
      scopes: validation.apiKey.scopes
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    })
    return
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: 'Admin access required'
    })
    return
  }

  next()
}

/**
 * Optional authentication - doesn't fail if no key is provided
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (authHeader) {
      const apiKey = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader

      const validation = await authService.validateApiKey(apiKey)
      if (validation) {
        req.user = {
          id: validation.user.id,
          username: validation.user.username,
          email: validation.user.email,
          role: validation.user.role
        }

        req.apiKey = {
          id: validation.apiKey.id,
          name: validation.apiKey.name,
          type: validation.apiKey.type,
          scopes: validation.apiKey.scopes
        }
      }
    }
    next()
  } catch (error) {
    // Continue without auth if there's an error
    next()
  }
}

