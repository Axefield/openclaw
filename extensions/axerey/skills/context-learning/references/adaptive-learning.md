# Adaptive Learning

Manage and monitor the adaptive learning system for continuous improvement.

## Usage
Use this command when you need to:
- Monitor learning progress
- Trigger ranker retraining
- Track performance improvements
- Optimize learning parameters
- Understand adaptive behavior

## Learning Operations
- **Performance Metrics**: Get current learning performance
- **Retrain Ranker**: Manually trigger ranker weight retraining
- **Track Context**: Monitor context effectiveness
- **Learning Status**: Check adaptive learning health
- **Memorize**: Store new memories with adaptive learning integration

## Example Usage
```
Get performance metrics
Retrain ranker
Track context outcome: "exec_12345"
Memorize: "Important project decision made on Q4 strategy"
```

## Adaptive Learning Features
- **Outcome-Based Ranking**: Memories that lead to wins get boosted
- **Multi-Armed Bandit**: Learns optimal k values per task type
- **Weight Adjustment**: Automatically adjusts ranking weights
- **Context Tracking**: Tracks which memories were helpful
- **Performance Optimization**: Continuously improves over time

## Learning Metrics
- **Ranking Accuracy**: How well memories are ranked
- **Context Relevance**: Quality of retrieved contexts
- **Success Rate**: Percentage of successful outcomes
- **Learning Progress**: Improvement over time
- **Weight Distribution**: Current ranking weight values

## Parameters
- **execId**: Execution ID for context tracking (optional)
- **outcome**: success, failure, or neutral (optional)
- **helpful**: Whether context was helpful (optional)
- **text**: Memory content to store (required for memorize)
- **tags**: Array of tags for categorization (optional)
- **importance**: Importance level 0-1 (optional, default 0.5)

## Benefits
- **Continuous Improvement**: System gets better with use
- **Personalized Learning**: Adapts to your specific needs
- **Performance Optimization**: Maximizes success rates
- **Automatic Tuning**: No manual parameter adjustment needed
- **Data-Driven**: Learning based on actual outcomes

## Best Practices
- Regular performance monitoring
- Provide outcome feedback consistently
- Allow time for learning to take effect
- Monitor learning progress over time
- Use performance metrics for optimization
