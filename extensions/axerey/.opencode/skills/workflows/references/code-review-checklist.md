# Code Review Checklist

Comprehensive code review process using memory context and reasoning tools.

## Usage
Use this command when you need to:
- Review code changes systematically
- Ensure quality standards
- Check for security issues
- Verify best practices
- Provide thorough feedback

## Review Process
1. **Context Retrieval**: Get relevant memories about coding standards, patterns, and project history
2. **Record Review Plan**: Document review approach and focus areas
3. **Security Check**: Look for common security vulnerabilities
4. **Performance Analysis**: Identify potential performance issues
5. **Best Practices**: Verify adherence to established patterns
6. **Record Review Findings**: Document issues, improvements, and learnings
7. **Reasoning Analysis**: Use mind-balance for complex decisions
8. **Extract Review Rules**: Create procedural knowledge from review patterns

## Example Usage
```
Review this code:
File: src/auth/controller.ts
Focus: security, performance, TypeScript standards

1. Record review plan: "Security-focused review of authentication controller"
   - Source: 'plan'
   - Tags: ["code-review", "security", "auth", "planning"]

2. Get context from context broker for review task

3. Execute security and performance analysis

4. Record review findings: "Found potential SQL injection vulnerability"
   - Source: 'execution'
   - Tags: ["code-review", "security", "vulnerability"]
   - Outcome: success (found issue)

5. Record belief: "Input validation is critical for preventing SQL injection"
   - Belief: true
   - Type: semantic

6. Extract rule: "Always validate and sanitize user inputs in database queries"
   - Type: 'procedural'

7. Mark important: "Security vulnerabilities must be addressed immediately"
   - Pinned: true
```

## Checklist Items
- [ ] TypeScript typing (no `any` types)
- [ ] Security vulnerabilities (input validation, sanitization)
- [ ] Performance optimizations
- [ ] Error handling
- [ ] Code organization and structure
- [ ] Documentation and comments
- [ ] Test coverage
- [ ] Memory context alignment

## Benefits
- Systematic review process
- Consistent quality standards
- Security vulnerability detection
- Performance optimization
- Knowledge-based recommendations
