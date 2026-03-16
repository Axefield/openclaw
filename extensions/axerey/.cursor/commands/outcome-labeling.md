# Label Outcome

Label execution outcomes with success metrics and efficiency scores for adaptive learning.

## Usage
Use this command when you need to:
- Track success of executed tasks
- Provide feedback on execution quality
- Help system learn from outcomes
- Measure efficiency and effectiveness
- Build performance history

## Outcome Labeling Process
1. **Execution Review**: Review completed task or decision
2. **Success Assessment**: Evaluate how successful the execution was
3. **Efficiency Rating**: Rate how efficiently the task was completed
4. **Metric Recording**: Record success metrics and scores
5. **Learning Update**: System learns from outcomes to improve future performance

## Example Usage
```
Label outcome:
Execution ID: "exec_12345"
Outcome: success
Score: 0.85
Efficiency: 0.9
Notes: "Successfully implemented TypeScript strict mode with no errors"
```

## Outcome Types
- **Success**: Task completed successfully
- **Failure**: Task failed or had issues
- **Neutral**: Task completed but with mixed results
- **Partial**: Task partially successful

## Metrics
- **Score**: Overall success score (0-1)
- **Efficiency**: How efficiently the task was completed (0-1)
- **Notes**: Additional context and observations

## Parameters
- **execId**: Execution ID to label (required)
- **outcome**: success, failure, or neutral (required)
- **score**: Success score 0-1 (optional)
- **efficiency**: Efficiency score 0-1 (optional)
- **notes**: Additional context (optional)

## Benefits
- **Performance Tracking**: Monitor success over time
- **Adaptive Learning**: System learns from outcomes
- **Pattern Recognition**: Identifies successful patterns
- **Continuous Improvement**: Optimizes based on results
- **Decision Support**: Uses outcome data for better decisions

## Best Practices
- Label outcomes promptly after execution
- Be honest about success and failure
- Provide detailed notes for context
- Regular outcome tracking
- Use consistent scoring criteria
