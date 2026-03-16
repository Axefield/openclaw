import { hash, compare } from 'bcrypt'
import { getDatabase, User, ApiKey } from './database'
import { createHash } from 'crypto'

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10)

export class AuthService {
  private db = getDatabase()

  async hashPassword(password: string): Promise<string> {
    return hash(password, BCRYPT_ROUNDS)
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return compare(password, hash)
  }

  async createUser(username: string, email: string, password: string, role: 'admin' | 'user' = 'user'): Promise<User> {
    const existingUser = this.db.getUserByUsername(username) || this.db.getUserByEmail(email)
    if (existingUser) {
      throw new Error('User already exists')
    }

    const passwordHash = await this.hashPassword(password)
    return this.db.createUser({
      username,
      email,
      passwordHash,
      role,
      isActive: true
    })
  }

  async authenticateUser(username: string, password: string): Promise<User | null> {
    const user = this.db.getUserByUsername(username)
    if (!user || !user.isActive) {
      return null
    }

    const isValid = await this.verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return null
    }

    return user
  }

  async validateApiKey(apiKey: string): Promise<{ user: User; apiKey: ApiKey } | null> {
    // Extract the key part (remove 'axerey_' prefix if present)
    const keyPart = apiKey.startsWith('axerey_') ? apiKey : `axerey_${apiKey}`
    const keyHash = createHash('sha256').update(keyPart).digest('hex')

    const apiKeyRecord = this.db.getApiKeyByHash(keyHash)
    if (!apiKeyRecord || !apiKeyRecord.isActive) {
      return null
    }

    // Check expiration
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < Date.now()) {
      return null
    }

    const user = this.db.getUserById(apiKeyRecord.userId)
    if (!user || !user.isActive) {
      return null
    }

    // Update last used timestamp
    this.db.updateApiKeyLastUsed(apiKeyRecord.id)

    return { user, apiKey: apiKeyRecord }
  }

  async createApiKeyForUser(
    userId: string,
    name: string,
    type: 'api' | 'mcp',
    scopes: string[] = ['*'],
    expiresAt?: number
  ): Promise<{ apiKey: ApiKey; plainKey: string }> {
    const user = this.db.getUserById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    return this.db.createApiKey({
      userId,
      keyHash: '', // Will be set by createApiKey
      keyPrefix: '', // Will be set by createApiKey
      name,
      type,
      scopes,
      lastUsedAt: null,
      expiresAt: expiresAt || null,
      isActive: true
    })
  }

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return this.db.getApiKeysByUserId(userId)
  }

  async revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const apiKey = this.db.getApiKeyById(keyId)
    if (!apiKey || apiKey.userId !== userId) {
      return false
    }

    return this.db.revokeApiKey(keyId)
  }

  async deleteApiKey(keyId: string, userId: string): Promise<boolean> {
    const apiKey = this.db.getApiKeyById(keyId)
    if (!apiKey || apiKey.userId !== userId) {
      return false
    }

    return this.db.deleteApiKey(keyId)
  }
}

export const authService = new AuthService()

