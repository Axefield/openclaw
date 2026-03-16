# Context Grading

Provide feedback on context helpfulness to improve adaptive ranking and memory selection.

## Usage
Use this command when you need to:
- Rate the quality of retrieved memories
- Improve adaptive learning system
- Provide feedback on context relevance
- Help system learn what memories are most useful
- Optimize memory retrieval for specific tasks

## Grading Process
1. **Context Evaluation**: Review memories provided for a task
2. **Helpfulness Rating**: Rate how helpful the memories were
3. **Feedback Submission**: Submit ratings to adaptive system
4. **Learning Update**: System learns from feedback to improve future retrieval
5. **Ranking Optimization**: Adaptive ranking weights are updated

## Example Usage
```
Grade context:
Memory IDs: ["mem_123", "mem_456", "mem_789"]
Helpful: true
Task: "TypeScript configuration setup"
```

## Grading Criteria
- **Relevance**: How relevant were the memories to the task?
- **Completeness**: Did the memories provide sufficient context?
- **Accuracy**: Were the memories factually correct?
- **Usefulness**: Did the memories help solve the problem?
- **Timeliness**: Were the memories current and up-to-date?

## Parameters
- **ids**: Array of memory IDs to grade (required)
- **helpful**: Whether the memories were helpful (required)

## Benefits
- **Adaptive Learning**: System learns from your feedback
- **Improved Retrieval**: Better memory selection over time
- **Quality Optimization**: Focuses on high-quality memories
- **Personalized Ranking**: Adapts to your preferences and needs
- **Continuous Improvement**: System gets better with use

## Best Practices
- Grade contexts regularly
- Be honest about helpfulness
- Provide specific feedback when possible
- Grade both helpful and unhelpful contexts
- Help system learn your preferences
