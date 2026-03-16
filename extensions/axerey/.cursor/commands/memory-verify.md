# Memory Verify

Verify factual claims and calculations in memories using memory-first strategy and truth-adaptation.

## Usage
Use this command when you need to:
- Verify factual claims in memories
- Check calculations for accuracy
- Validate information before using it
- Ensure memory reliability
- Build trust in stored knowledge

## Verification Process

1. **Memory-First Strategy**: Check existing verified memories first
2. **Calculation Detection**: Identify and verify mathematical claims
3. **Factual Claim Detection**: Identify factual statements
4. **External Verification**: Use web search or APIs if needed
5. **Truth Adaptation**: Adjust confidence based on verification results

## Verification Status

- **verified**: Claim is confirmed true
- **partially_verified**: Some aspects verified, others uncertain
- **unverified**: Not yet verified (default state)
- **contradicted**: Evidence contradicts the claim
- **uncertain**: Insufficient evidence to determine truth

## Example Usage
```
Verify memory:
Memory ID: memory-id-123
Check calculations: true
Force verification: false
```

## Parameters
- **memoryId**: ID of memory to verify (required)
- **forceVerification**: Force re-verification even if already verified (default: false)
- **containsCalculations**: Memory contains calculations to verify (default: false)
- **useTruthAdaptation**: Use truth-adaptation scoring (default: true)
- **checkMemoriesFirst**: Check existing memories before external search (default: true)
- **useGonSearch**: Use web search for external verification (default: true)

## Automatic Verification

Memories are automatically verified in the background when:
- New memories are created
- Memories are updated
- Verification is enabled in configuration

## Verification Results

Stored in `memory_verifications` table:
- Status and confidence score
- Sources of verification
- Verified calculations (if any)
- Timestamp of verification

## Benefits
- **Reliability**: Ensure memories contain accurate information
- **Trust**: Build confidence in stored knowledge
- **Error Detection**: Catch incorrect claims early
- **Quality Assurance**: Maintain high-quality memory base
- **Decision Support**: Make decisions based on verified information

## Best Practices
- Verify important memories before critical decisions
- Enable automatic verification for new memories
- Review verification results regularly
- Update verification when new information becomes available
- Use verification to identify unreliable memories

## UI Integration

Verification status is displayed in:
- Memory cards (verification badge)
- Memory detail view
- Graph view (color-coded by verification status)

