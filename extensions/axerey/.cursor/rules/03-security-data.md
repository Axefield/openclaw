# Security and Data Handling

## Encryption Standards

**Supported Algorithms**:
- AES-256-GCM (primary)
- ChaCha20-Poly1305 (alternative)

**Implementation**: `src/config/encryption.ts`

**Key Derivation Options**:
- PBKDF2 (default)
- Argon2 (recommended for new implementations)
- scrypt (alternative)

**Never Store**: Plaintext secrets, API keys, passwords, or tokens

## Configuration Security

**Loading Pattern**: Use `VagogonSecureConfigManager.getInstance()`

**Security Features**:
- Signature verification for config integrity
- Checksum validation
- Audit logging with timestamps
- Environment-specific overrides

**Files to Reference**:
- `src/config/secure-manager.ts` - Main secure manager
- `src/config/validator.ts` - Validation and security checks
- `src/config/vagogon-schema.ts` - Schema definitions

**Security Checks**:
```typescript
// Pattern from src/config/validator.ts
private async performSecurityChecks(config: any): Promise<SecurityCheck[]> {
  // Check for sensitive data exposure
  // Check for insecure defaults
  // Check for excessive permissions
}
```

## Input Validation

**MCP Tools**: Validate all inputs with Zod schemas
```typescript
const MemorizeSchema = z.object({
  text: z.string().min(1).max(10000),
  tags: z.array(z.string()).max(20),
  importance: z.number().min(0).max(1)
});
```

**Security Scanning**: Check for sensitive data in configs
- Scan for: passwords, tokens, keys, credentials
- Reject inputs containing sensitive patterns
- Log security violations

**Pattern Reference**: See `src/config/validator.ts` `performSecurityChecks()` method

## Environment Variables

**Sensitive Data**: ONLY in `.env` files, never in code

**Template Documentation**: `env.template` documents all variables
```env
# Database Configuration
PCM_DB=./pcm.db

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your-openai-api-key-here

# Node Environment
NODE_ENV=production
```

**Loading**: Use `dotenv` package, check `process.env`
```typescript
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.warn('OpenAI API key not found, using fallback embeddings');
}
```

**Examples**:
- `PCM_DB` - Database file path
- `OPENAI_API_KEY` - OpenAI API key for embeddings
- `NODE_ENV` - Environment (development/production)

## Data Sanitization

**Logs**: Never log sensitive information
```typescript
// Bad
console.log('API Key:', apiKey);

// Good
console.log('API Key configured:', !!apiKey);
```

**Configs**: Redact sensitive fields before storing
```typescript
const sanitizedConfig = {
  ...config,
  apiKey: config.apiKey ? '[REDACTED]' : undefined
};
```

**Memory System**: Don't store credentials in memory
- No API keys in memory content
- No passwords in stored text
- No tokens in memory metadata

**Database**: Use parameterized queries
```typescript
// Good
const stmt = db.prepare('SELECT * FROM memories WHERE id = ?');
const result = stmt.get(memoryId);

// Bad
const query = `SELECT * FROM memories WHERE id = '${memoryId}'`;
```

## Security Patterns

**Configuration Loading**:
1. Load from secure manager
2. Validate with schema
3. Perform security checks
4. Apply environment overrides
5. Audit log the operation

**API Key Handling**:
1. Load from environment variables
2. Validate format if possible
3. Use for API calls only
4. Never log or store in memory
5. Provide fallback behavior

**Database Security**:
1. Use parameterized queries
2. Validate all inputs
3. Sanitize before storage
4. Encrypt sensitive fields
5. Regular security audits

## Error Handling Security

**Never Expose**:
- Internal file paths
- Database schemas
- API keys or tokens
- Stack traces in production
- Internal error details

**Safe Error Messages**:
```typescript
// Bad
throw new Error(`Database error: ${dbError.message}`);

// Good
console.error('Database error:', dbError);
return { error: 'Database operation failed' };
```

## Key Principles

1. **Defense in Depth**: Multiple layers of security
2. **Least Privilege**: Minimal required permissions
3. **Fail Secure**: Secure defaults when things go wrong
4. **Audit Everything**: Log all security-relevant operations
5. **Never Trust Input**: Validate and sanitize everything
6. **Encrypt Sensitive Data**: At rest and in transit
7. **Regular Security Reviews**: Audit code for vulnerabilities
