# Memory Types & Context

Comprehensive guide to memory types and their contextual roles in the Vagogon system.

## Usage
Use this command to understand how different memory types work together to create rich contextual knowledge and how to properly categorize memories for optimal context broker performance.

## Memory Type System

### **Episodic Memories**
**Purpose**: Specific events, experiences, and occurrences

**Characteristics**:
- **Temporal**: Linked to specific time periods
- **Personal**: Based on direct experience
- **Detailed**: Rich contextual information
- **Unique**: One-time occurrences

**Contextual Role**:
- **Plans**: Future planning based on past experiences
- **Executions**: Implementation guidance from similar past work
- **Pattern Recognition**: Identifying recurring patterns
- **Decision Support**: Learning from past decisions

**Examples**:
```
Type: episodic
Text: "Successfully implemented JWT authentication with proper error handling"
Tags: ["auth", "jwt", "implementation", "success"]
Source: execution
Session: "auth-implementation-2024"
```

### **Semantic Memories**
**Purpose**: General knowledge, facts, concepts, and understanding

**Characteristics**:
- **Timeless**: Not tied to specific events
- **Factual**: Objective knowledge and information
- **Reusable**: Applicable across different contexts
- **Consolidated**: Often derived from multiple experiences

**Contextual Role**:
- **Beliefs**: Consolidated knowledge (belief: true)
- **Knowledge Base**: General understanding and facts
- **Reference**: Quick access to established knowledge
- **Learning Foundation**: Building blocks for new understanding

**Examples**:
```
Type: semantic
Text: "JWT tokens provide stateless authentication that scales better than session-based auth"
Tags: ["auth", "jwt", "knowledge", "scalability"]
Belief: true
Confidence: 0.95
```

### **Procedural Memories**
**Purpose**: Rules, procedures, methods, and how-to knowledge

**Characteristics**:
- **Actionable**: Step-by-step instructions
- **Conditional**: IF/THEN rules and procedures
- **Reusable**: Applicable to similar situations
- **Systematic**: Structured approaches and methods

**Contextual Role**:
- **Rules**: Procedural knowledge (type: 'procedural')
- **Guidance**: Step-by-step instructions
- **Best Practices**: Established procedures
- **Decision Support**: Rule-based decision making

**Examples**:
```
Type: procedural
Text: "Always validate JWT tokens on every request and handle token expiration gracefully"
Tags: ["auth", "jwt", "rule", "validation"]
Source: execution
Confidence: 0.9
```

## Contextual Memory Categories

### **Source-Based Categories**

#### **Plans** (`source: 'plan'`)
- **Purpose**: Future planning and goal setting
- **Context**: Retrieved for planning tasks
- **Content**: Objectives, strategies, approaches
- **Usage**: Context broker includes latest plans

#### **Executions** (`source: 'execution'`)
- **Purpose**: Implementation experiences and outcomes
- **Context**: Retrieved for execution tasks
- **Content**: What was done, how it went, results
- **Usage**: Context broker includes recent executions

#### **Signals** (`source: 'signal'`)
- **Purpose**: External information and observations
- **Context**: Retrieved for analysis tasks
- **Content**: External data, observations, signals
- **Usage**: Context broker includes relevant signals

#### **Accounts** (`source: 'account'`)
- **Purpose**: Documentation and record keeping
- **Context**: Retrieved for review tasks
- **Content**: Records, documentation, accounts
- **Usage**: Context broker includes relevant accounts

### **Special Memory Flags**

#### **Beliefs** (`belief: true`)
- **Purpose**: Consolidated knowledge and established facts
- **Context**: Retrieved as foundational knowledge
- **Content**: Proven facts, consolidated understanding
- **Usage**: Context broker prioritizes beliefs

#### **Pinned** (`pinned: true`)
- **Purpose**: Important information for quick access
- **Context**: Retrieved with priority boost
- **Content**: Critical information, important lessons
- **Usage**: Context broker gives pinned memories priority

#### **Important** (`tags: ['important']`)
- **Purpose**: Critical information for priority access
- **Context**: Retrieved for important tasks
- **Content**: Critical lessons, essential knowledge
- **Usage**: Context broker includes important memories

## Contextual Memory Patterns

### **Planning Context Pattern**
```
1. Plans (source: 'plan') - Latest planning context
2. Executions (source: 'execution') - Past implementation experience
3. Beliefs (belief: true) - Consolidated knowledge
4. Rules (type: 'procedural') - Procedural guidance
5. Important (pinned: true) - Critical information
```

### **Execution Context Pattern**
```
1. Executions (source: 'execution') - Recent implementation experience
2. Rules (type: 'procedural') - Step-by-step procedures
3. Beliefs (belief: true) - Established knowledge
4. Plans (source: 'plan') - Current objectives
5. Important (pinned: true) - Critical requirements
```

### **Reasoning Context Pattern**
```
1. Reasoning (tags: ['reasoning']) - Past reasoning processes
2. Decisions (tags: ['decision']) - Decision outcomes
3. Arguments (tags: ['argument']) - Argument analysis
4. Beliefs (belief: true) - Consolidated knowledge
5. Rules (type: 'procedural') - Decision procedures
```

### **Learning Context Pattern**
```
1. Learning (tags: ['learning']) - Past learning experiences
2. Beliefs (belief: true) - Consolidated knowledge
3. Rules (type: 'procedural') - Learning procedures
4. Important (pinned: true) - Key concepts
5. Outcomes (source: 'execution') - Learning results
```

## Memory Type Best Practices

### **Episodic Memory Recording**
```
1. Record specific events and experiences
2. Include temporal context (session, date)
3. Capture rich contextual details
4. Link to related semantic and procedural memories
5. Use for pattern recognition and learning
```

### **Semantic Memory Recording**
```
1. Consolidate multiple experiences into facts
2. Use belief: true for established knowledge
3. Include confidence levels
4. Make timeless and reusable
5. Use for foundational knowledge
```

### **Procedural Memory Recording**
```
1. Extract rules from successful patterns
2. Use type: 'procedural' for procedures
3. Include conditional logic (IF/THEN)
4. Make actionable and specific
5. Use for guidance and decision support
```

### **Contextual Memory Organization**
```
1. Use consistent tags for retrieval
2. Set appropriate importance scores
3. Pin critical information
4. Link related memories
5. Update beliefs based on new evidence
```

## Memory Type Integration

### **Workflow Integration**
```
1. Plans → Record with source: 'plan'
2. Executions → Record with source: 'execution'
3. Beliefs → Record with belief: true
4. Rules → Record with type: 'procedural'
5. Important → Record with pinned: true
6. Reasoning → Record with reasoning tags
7. Outcomes → Record with outcome metrics
```

### **Context Broker Integration**
```
1. Context broker retrieves by memory type
2. Different tasks get different memory types
3. Adaptive ranking considers memory types
4. Learning system tracks memory type effectiveness
5. Pattern recognition uses memory type patterns
```

### **Learning Integration**
```
1. Episodic → Pattern recognition and learning
2. Semantic → Knowledge consolidation
3. Procedural → Rule extraction and refinement
4. All types → Outcome-based learning
5. Cross-type → Relationship learning
```

## Advanced Memory Type Features

### **Memory Type Transitions**
```
Episodic → Semantic: Consolidate experiences into facts
Episodic → Procedural: Extract rules from patterns
Semantic → Procedural: Convert knowledge into procedures
All types → Important: Mark critical information
All types → Beliefs: Promote to consolidated knowledge
```

### **Memory Type Relationships**
```
Plans → Executions: Planning leads to implementation
Executions → Beliefs: Experience consolidates into knowledge
Beliefs → Rules: Knowledge becomes procedures
Rules → Executions: Procedures guide implementation
All types → Outcomes: All types contribute to results
```

### **Memory Type Optimization**
```
1. Use appropriate types for different purposes
2. Transition between types as knowledge matures
3. Link related memories across types
4. Update types based on new evidence
5. Optimize retrieval based on memory types
```

## Best Practices

### **Memory Type Selection**
1. **Use episodic** for specific events and experiences
2. **Use semantic** for general knowledge and facts
3. **Use procedural** for rules and procedures
4. **Use appropriate sources** for contextual categorization
5. **Use special flags** for priority and importance

### **Contextual Organization**
1. **Link related memories** across types
2. **Use consistent tagging** for retrieval
3. **Set appropriate importance** scores
4. **Pin critical information** for priority
5. **Update beliefs** based on new evidence

### **Learning Integration**
1. **Track memory type effectiveness** through outcomes
2. **Learn optimal memory type combinations** for tasks
3. **Adapt memory type usage** based on success patterns
4. **Build expertise** through memory type relationships
5. **Optimize context selection** based on memory types
