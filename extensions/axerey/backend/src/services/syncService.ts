import { getDatabase, User } from './database'
import { authService } from './authService'

export interface SyncUserData {
  externalId: string
  username: string
  email: string
  role?: 'admin' | 'user'
  isActive?: boolean
  metadata?: Record<string, any>
}

export class SyncService {
  private db = getDatabase()
  private readonly DEFAULT_SOURCE = 'parent-domain'

  /**
   * Sync a user from the parent domain
   * Creates new user if doesn't exist, updates if exists
   */
  async syncUser(data: SyncUserData, source: string = this.DEFAULT_SOURCE): Promise<{ user: User; created: boolean }> {
    // Check if user exists by external ID
    let user = this.db.getUserByExternalId(data.externalId, source)

    if (user) {
      // Update existing user
      // Convert metadata Record to JSON string if provided, otherwise keep existing
      const metadataValue = data.metadata 
        ? JSON.stringify(data.metadata) 
        : user.metadata

      const updates: Partial<User> = {
        username: data.username,
        email: data.email,
        isActive: data.isActive !== undefined ? data.isActive : user.isActive,
        metadata: metadataValue
      }

      if (data.role && user.role !== data.role) {
        updates.role = data.role
      }

      const updated = this.db.updateUser(user.id, updates)
      return { user: updated!, created: false }
    }

    // Check if user exists by email (in case external ID wasn't set initially)
    const existingByEmail = this.db.getUserByEmail(data.email)
    if (existingByEmail) {
      // Link existing user to external ID
      // Convert metadata Record to JSON string if provided, otherwise keep existing
      const metadataValue = data.metadata 
        ? JSON.stringify(data.metadata) 
        : existingByEmail.metadata

      this.db.updateUser(existingByEmail.id, {
        externalId: data.externalId,
        externalSource: source,
        username: data.username,
        isActive: data.isActive !== undefined ? data.isActive : existingByEmail.isActive,
        metadata: metadataValue
      })
      return { user: this.db.getUserById(existingByEmail.id)!, created: false }
    }

    // Create new user
    // Generate a temporary password (user won't use it, they'll use parent domain auth)
    const tempPassword = `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const passwordHash = await authService.hashPassword(tempPassword)

    // Convert metadata Record to JSON string if provided
    const metadataValue = data.metadata ? JSON.stringify(data.metadata) : undefined

    const newUser = this.db.createUser({
      username: data.username,
      email: data.email,
      passwordHash,
      role: data.role || 'user',
      isActive: data.isActive !== undefined ? data.isActive : true,
      externalId: data.externalId,
      externalSource: source,
      metadata: metadataValue
    })

    return { user: newUser, created: true }
  }

  /**
   * Sync multiple users at once
   */
  async syncUsers(users: SyncUserData[], source: string = this.DEFAULT_SOURCE): Promise<{
    created: number
    updated: number
    errors: Array<{ user: SyncUserData; error: string }>
  }> {
    let created = 0
    let updated = 0
    const errors: Array<{ user: SyncUserData; error: string }> = []

    for (const userData of users) {
      try {
        const result = await this.syncUser(userData, source)
        if (result.created) {
          created++
        } else {
          updated++
        }
      } catch (error) {
        errors.push({
          user: userData,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return { created, updated, errors }
  }

  /**
   * Get user by external ID
   */
  getUserByExternalId(externalId: string, source: string = this.DEFAULT_SOURCE): User | null {
    return this.db.getUserByExternalId(externalId, source)
  }

  /**
   * Delete user by external ID (soft delete - sets isActive to false)
   */
  async deactivateUserByExternalId(externalId: string, source: string = this.DEFAULT_SOURCE): Promise<boolean> {
    const user = this.db.getUserByExternalId(externalId, source)
    if (!user) return false

    this.db.updateUser(user.id, { isActive: false })
    return true
  }
}

export const syncService = new SyncService()

