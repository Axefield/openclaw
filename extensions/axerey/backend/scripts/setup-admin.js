#!/usr/bin/env ts-node
"use strict";
/**
 * Setup script to create admin user and generate API keys
 * Usage: ts-node backend/scripts/setup-admin.ts
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
// Set working directory to backend folder first
const backendDir = path_1.default.join(__dirname, '..');
process.chdir(backendDir);
// Now import after changing directory
const authService_1 = require("../src/services/authService");
const database_1 = require("../src/services/database");
const readline = __importStar(require("readline"));
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}
async function setupAdmin() {
    console.log('🔐 Axerey Admin Setup\n');
    console.log('This script will:');
    console.log('1. Create an admin user account');
    console.log('2. Generate API keys for API and MCP protocols\n');
    try {
        // Check if admin already exists
        const db = (0, database_1.getDatabase)();
        const existingAdmin = db.getAllUsers().find(u => u.role === 'admin');
        if (existingAdmin) {
            console.log(`⚠️  Admin user already exists: ${existingAdmin.username}`);
            const proceed = await question('Do you want to create another admin user? (y/n): ');
            if (proceed.toLowerCase() !== 'y') {
                console.log('Setup cancelled.');
                rl.close();
                return;
            }
        }
        // Get user details
        const username = await question('Enter username (default: admin): ') || 'admin';
        const email = await question('Enter email: ');
        if (!email) {
            console.error('❌ Email is required');
            rl.close();
            return;
        }
        const password = await question('Enter password (min 8 characters): ');
        if (password.length < 8) {
            console.error('❌ Password must be at least 8 characters');
            rl.close();
            return;
        }
        // Create admin user
        console.log('\n📝 Creating admin user...');
        const user = await authService_1.authService.createUser(username, email, password, 'admin');
        console.log(`✅ Admin user created: ${user.username} (${user.email})`);
        // Generate API keys
        console.log('\n🔑 Generating API keys...');
        const { apiKey: apiKeyRecord, plainKey: apiPlainKey } = await authService_1.authService.createApiKeyForUser(user.id, 'Default API Key', 'api', ['*']);
        const { apiKey: mcpKeyRecord, plainKey: mcpPlainKey } = await authService_1.authService.createApiKeyForUser(user.id, 'Default MCP Key', 'mcp', ['*']);
        console.log('\n✅ Setup complete!\n');
        console.log('='.repeat(60));
        console.log('📋 IMPORTANT: Save these credentials securely!');
        console.log('='.repeat(60));
        console.log(`\n👤 Admin User:`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`\n🔑 API Key (for REST API):`);
        console.log(`   ${apiPlainKey}`);
        console.log(`   Key ID: ${apiKeyRecord.id}`);
        console.log(`   Prefix: ${apiKeyRecord.keyPrefix}`);
        console.log(`\n🔑 MCP Key (for MCP Protocol):`);
        console.log(`   ${mcpPlainKey}`);
        console.log(`   Key ID: ${mcpKeyRecord.id}`);
        console.log(`   Prefix: ${mcpKeyRecord.keyPrefix}`);
        console.log('\n' + '='.repeat(60));
        console.log('⚠️  These keys will NOT be shown again!');
        console.log('⚠️  Store them securely before closing this window!');
        console.log('='.repeat(60));
        console.log('\n📖 Usage:');
        console.log('   API: Add header: Authorization: Bearer <api-key>');
        console.log('   MCP: Use in MCP configuration as API key');
        console.log('');
    }
    catch (error) {
        console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
    finally {
        rl.close();
    }
}
setupAdmin().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
