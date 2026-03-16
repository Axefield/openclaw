#!/usr/bin/env ts-node

/**
 * Setup script to create admin user and generate API keys
 * Usage: ts-node backend/scripts/setup-admin.ts
 */

import path from 'path'

// Set working directory to backend folder first
const backendDir = path.join(__dirname, '..')
process.chdir(backendDir)

// Now import after changing directory
import { authService } from '../src/services/authService'
import { getDatabase } from '../src/services/database'
import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setupAdmin() {
  console.log('🔐 Axerey Admin Setup\n')
  console.log('This script will:')
  console.log('1. Create an admin user account')
  console.log('2. Generate API keys for API and MCP protocols\n')

  try {
    // Check if admin already exists
    const db = getDatabase()
    const existingAdmin = db.getAllUsers().find(u => u.role === 'admin')
    
    if (existingAdmin) {
      console.log(`⚠️  Admin user already exists: ${existingAdmin.username}`)
      const proceed = await question('Do you want to create another admin user? (y/n): ')
      if (proceed.toLowerCase() !== 'y') {
        console.log('Setup cancelled.')
        rl.close()
        return
      }
    }

    // Get user details
    const username = await question('Enter username (default: admin): ') || 'admin'
    const email = await question('Enter email: ')
    if (!email) {
      console.error('❌ Email is required')
      rl.close()
      return
    }

    const password = await question('Enter password (min 8 characters): ')
    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters')
      rl.close()
      return
    }

    // Create admin user
    console.log('\n📝 Creating admin user...')
    const user = await authService.createUser(username, email, password, 'admin')
    console.log(`✅ Admin user created: ${user.username} (${user.email})`)

    // Generate API keys
    console.log('\n🔑 Generating API keys...')
    
    const { apiKey: apiKeyRecord, plainKey: apiPlainKey } = await authService.createApiKeyForUser(
      user.id,
      'Default API Key',
      'api',
      ['*']
    )
    
    const { apiKey: mcpKeyRecord, plainKey: mcpPlainKey } = await authService.createApiKeyForUser(
      user.id,
      'Default MCP Key',
      'mcp',
      ['*']
    )

    console.log('\n✅ Setup complete!\n')
    console.log('='.repeat(60))
    console.log('📋 IMPORTANT: Save these credentials securely!')
    console.log('='.repeat(60))
    console.log(`\n👤 Admin User:`)
    console.log(`   Username: ${user.username}`)
    console.log(`   Email: ${user.email}`)
    console.log(`\n🔑 API Key (for REST API):`)
    console.log(`   ${apiPlainKey}`)
    console.log(`   Key ID: ${apiKeyRecord.id}`)
    console.log(`   Prefix: ${apiKeyRecord.keyPrefix}`)
    console.log(`\n🔑 MCP Key (for MCP Protocol):`)
    console.log(`   ${mcpPlainKey}`)
    console.log(`   Key ID: ${mcpKeyRecord.id}`)
    console.log(`   Prefix: ${mcpKeyRecord.keyPrefix}`)
    console.log('\n' + '='.repeat(60))
    console.log('⚠️  These keys will NOT be shown again!')
    console.log('⚠️  Store them securely before closing this window!')
    console.log('='.repeat(60))
    console.log('\n📖 Usage:')
    console.log('   API: Add header: Authorization: Bearer <api-key>')
    console.log('   MCP: Use in MCP configuration as API key')
    console.log('')

  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

setupAdmin().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

