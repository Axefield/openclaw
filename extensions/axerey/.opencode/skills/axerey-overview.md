# Vagogon MCP Tools Overview

> **INSTRUCTION**: When this command is invoked, learn and understand the Vagogon MCP system architecture, tools, and best practices. Do not memorize or store this information - simply learn it so you can work effectively with the system. After learning, acknowledge that you understand the system and are ready to work with it.

Complete guide to all 32 Vagogon MCP tools and commands for multi-persona memory and reasoning.

## 🧠 Core Memory Operations (6)
- `/memory-store` - Store new memories with context, tags, and metadata
- `/memory-search` - Semantic search through stored memories using embeddings
- `/memory-recall` - Retrieve specific or recent memories with smart ranking
- `/memory-update` - Modify existing memory content and regenerate embeddings
- `/memory-pin` - Pin important memories for quick access and priority
- `/memory-forget` - Delete memories permanently from the system

## 🎭 Persona Management (4)
- `/persona-management` - Manage different analytical personas with isolated memory contexts
- **persona_list** - List all available personas
- **persona_switch** - Switch to a different persona
- **persona_current** - Get current persona information
- **persona_config** - Get persona-specific configuration

## 📊 Advanced Memory Management (9)
- `/memory-consolidate` - Cluster related memories using K-means clustering
- `/memory-extract-rules` - Pattern mine executions to generate IF/THEN procedural rules
- `/memory-reflect` - Extract distilled lessons and update procedural rules
- `/memory-decay` - Clean up low-value memories automatically
- `/memory-pin-set` - Create curated memory sets for organized access
- `/daily-summary` - Create comprehensive daily activity summaries
- `/contextual-recording` - Record different types of contextual information using the context broker system
- `/contextual-workflow` - Complete workflow for recording and retrieving contextual stages
- `/memory-types-context` - Comprehensive guide to memory types and their contextual roles

## 🎯 Context & Learning (5)
- `/context-broker` - Get task-specific memory context for planning/execution/review
- `/context-grading` - Rate context helpfulness to improve adaptive ranking
- `/outcome-labeling` - Label execution outcomes with success metrics
- `/context-explanation` - Get explanations for memory selection decisions
- `/adaptive-learning` - Monitor and manage adaptive learning system

## 🧠 Reasoning & Decision Making (8)
- `/comprehensive-reasoning` - Unified reasoning system orchestrating memory, context, and argument analysis
- `/argument-construction` - Build, analyze, and evaluate arguments using memory context and reasoning tools
- `/decision-analysis` - Comprehensive decision-making with memory integration and outcome analysis
- `/mind-balance` - Probabilistic decision-making with angel/demon advisory system
- `/argument-steelman` - Strengthen arguments by finding their most charitable version
- `/argument-strawman` - Analyze arguments to identify distortions and fallacies
- `/reasoning-with-memory` - Perform reasoning tasks with relevant memory context
- `/decision-patterns` - Analyze decision patterns and extract insights from outcomes

## 🔧 System Monitoring (2)
- `/performance-metrics` - Get adaptive ranker and system performance data
- `/vss-status` - Check Vector Similarity Search status and performance metrics

## 🚀 Specialized Workflows (5)
- `/comprehensive-workflow` - Complete workflow combining multiple tools for complex projects
- `/code-review-checklist` - Systematic code review process with memory context
- `/architecture-decision` - Informed architectural choices using reasoning tools
- `/troubleshooting-guide` - Structured problem-solving with pattern recognition
- `/learning-session` - Structured learning process with knowledge consolidation

## 📋 Quick Reference

### Memory Types
- **Episodic**: Specific events/experiences (e.g., "Successfully implemented JWT authentication")
- **Semantic**: General knowledge/facts (e.g., "JWT tokens provide stateless authentication")
- **Procedural**: Rules and procedures (e.g., "Always validate JWT tokens on requests")

### Memory Sources
- **plan**: Planning context and objectives
- **execution**: Implementation experiences and outcomes
- **signal**: External information and observations
- **account**: Documentation and record keeping

### Special Memory Flags
- **belief: true**: Consolidated knowledge and established facts
- **pinned: true**: Important information for quick access
- **important**: Critical information (use in tags)

### Session Types
- **general**: General development work
- **reasoning**: Complex problem-solving tasks
- **decision-making**: Important decision processes
- **argument-analysis**: Analyzing arguments or debates

### Reasoning Types
- **mind-balance**: Angel/demon probabilistic decision-making
- **steelman**: Strengthen arguments objectively
- **strawman**: Analyze argument weaknesses
- **pipeline**: Transform distorted claims to strongest form

### Decision Modes
- **angel**: Optimistic, opportunity-focused perspective
- **demon**: Critical, risk-focused perspective
- **blend**: Balanced combination of both
- **probabilistic**: Statistical analysis of options

## 🎯 Best Practices

### Memory Management
1. **Start sessions** for focused work with clear goals
2. **Store important decisions** and learnings with proper tags
3. **Use context broker** for task-specific information retrieval
4. **Regular consolidation** and reflection for knowledge organization
5. **Pin frequently accessed** memories for quick access
6. **Record contextual stages** (plans, executions, beliefs, rules, outcomes)
7. **Use contextual workflows** for complete learning cycles

### Learning & Improvement
6. **Grade contexts** regularly to improve adaptive ranking
7. **Label outcomes** to help system learn from results
8. **Extract rules** from successful patterns automatically
9. **Use comprehensive reasoning** for complex analysis and decisions
10. **Monitor performance** metrics for continuous optimization

### Reasoning & Analysis
11. **Use comprehensive reasoning** for complex multi-step analysis
12. **Build arguments systematically** with evidence and context
13. **Apply decision analysis** for important choices with multiple factors
14. **Integrate memory context** into all reasoning processes
15. **Learn from reasoning outcomes** to improve future analysis

### Persona & Organization
16. **Switch personas** for different types of analytical work
17. **Create pin sets** for organized knowledge collections
18. **Use daily summaries** for progress tracking and reflection
19. **Leverage adaptive learning** for personalized optimization
20. **Maintain memory quality** through regular decay and consolidation
