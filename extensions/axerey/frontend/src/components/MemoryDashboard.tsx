import React, { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Row, Col, Input, Button, Badge, Spinner, Alert, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap'
import type { Memory, MemoryConnection, VerificationResult, QualityMetrics } from '../types/index'
import { apiService } from '../services/api'
import { VerificationBadge } from './VerificationBadge'
import { QualityMetrics as QualityMetricsComponent } from './QualityMetrics'
import { ConnectionModal } from './ConnectionModal'
import { MemoryGraph } from './MemoryGraph'
import { ReasoningTimeline } from './ReasoningTimeline'
import { NextStepsPanel } from './NextStepsPanel'
import { MemoryMiniGraph } from './MemoryMiniGraph'
import { MemoryMiniList } from './MemoryMiniList'

const MemoryDashboard: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<Memory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Filter and sort state - using arrays for multi-select
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [selectedSources, setSelectedSources] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string>('recent')
  const [showPinnedOnly, setShowPinnedOnly] = useState(false)
  const [showBeliefsOnly, setShowBeliefsOnly] = useState(false)
  
  // CRUD state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPinning, setIsPinning] = useState<string | null>(null)
  
  // Smart-Thinking features state
  const [activeTab, setActiveTab] = useState('list')
  const [selectedMemoryForConnection, setSelectedMemoryForConnection] = useState<Memory | null>(null)
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false)
  const [memoryConnections, setMemoryConnections] = useState<Map<string, MemoryConnection[]>>(new Map())
  const [memoryVerifications, setMemoryVerifications] = useState<Map<string, VerificationResult>>(new Map())
  const [memoryQualities, setMemoryQualities] = useState<Map<string, QualityMetrics>>(new Map())
  const [currentSessionId] = useState<string | null>(null) // TODO: Get from active session context
  
  // Create/Edit form state
  const [formData, setFormData] = useState({
    text: '',
    tags: '',
    importance: 0.5,
    type: 'episodic',
    source: 'plan',
    confidence: 1.0
  })

  useEffect(() => {
    loadMemories()
  }, [])

  const loadMemories = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.getMemories(500)
      
      if (response.success) {
        // Ensure response.data is an array
        const memoriesData = Array.isArray(response.data) ? response.data : []
        setMemories(memoriesData)
      } else {
        setError(response.error || 'Failed to load memories')
        setMemories([]) // Ensure memories is always an array
      }
    } catch (error) {
      setError('Network error: Unable to connect to Ouranigon MCP')
      setMemories([]) // Ensure memories is always an array
    } finally {
      setIsLoading(false)
    }
  }

  const searchMemories = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const response = await apiService.searchMemories(searchQuery, 50)
      
      if (response.success) {
        // Ensure response.data is an array
        const searchData = Array.isArray(response.data) ? response.data : []
        setSearchResults(searchData)
      } else {
        setError(response.error || 'Search failed')
        setSearchResults([]) // Ensure searchResults is always an array
      }
    } catch (error) {
      setError('Network error during search')
      setSearchResults([]) // Ensure searchResults is always an array
    } finally {
      setIsSearching(false)
    }
  }

  const getMemoryTypeColor = (type: string) => {
    switch (type) {
      case 'episodic': return 'warning' // Orange
      case 'semantic': return 'primary' // Purple
      case 'procedural': return 'success' // Green
      default: return 'secondary'
    }
  }

  const getImportanceColor = (importance: number) => {
    if (importance > 0.7) return 'danger'
    if (importance > 0.4) return 'warning'
    return 'success'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  // Get all unique tags from memories with counts - memoized for performance
  const getAllTagsWithCounts = React.useMemo(() => {
    const tagCounts: { [key: string]: number } = {}
    const allTags = new Set<string>()
    
    // Safety check: ensure memories is an array
    if (!Array.isArray(memories)) {
      return []
    }
    
    memories.forEach(memory => {
      if (memory.tags) {
        memory.tags.forEach(tag => {
          allTags.add(tag)
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      }
    })
    
    // Sort by count (most popular first), then alphabetically
    return Array.from(allTags)
      .sort((a, b) => {
        const countDiff = tagCounts[b] - tagCounts[a]
        return countDiff !== 0 ? countDiff : a.localeCompare(b)
      })
      .map(tag => ({ tag, count: tagCounts[tag] }))
  }, [memories])

  // Toggle functions for multi-select
  const toggleType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleSource = (source: string) => {
    setSelectedSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    )
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  // CRUD Functions
  const createMemory = async () => {
    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      const response = await fetch('http://localhost:3001/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: formData.text,
          tags,
          importance: formData.importance,
          type: formData.type,
          source: formData.source,
          confidence: formData.confidence
        })
      })
      
      const data = await response.json()
      if (data.success) {
        await loadMemories() // Refresh the list
        setIsCreateModalOpen(false)
        resetForm()
      } else {
        setError(data.error || 'Failed to create memory')
      }
    } catch (error) {
      setError('Network error: Unable to create memory')
    }
  }

  const updateMemory = async () => {
    if (!editingMemory) return
    
    try {
      const response = await fetch(`http://localhost:3001/api/memories/${editingMemory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: formData.text })
      })
      
      const data = await response.json()
      if (data.success) {
        await loadMemories() // Refresh the list
        setIsEditModalOpen(false)
        setEditingMemory(null)
        resetForm()
      } else {
        setError(data.error || 'Failed to update memory')
      }
    } catch (error) {
      setError('Network error: Unable to update memory')
    }
  }

  const deleteMemory = async (id: string) => {
    try {
      setIsDeleting(id)
      const response = await fetch(`http://localhost:3001/api/memories/${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      if (data.success) {
        await loadMemories() // Refresh the list
      } else {
        setError(data.error || 'Failed to delete memory')
      }
    } catch (error) {
      setError('Network error: Unable to delete memory')
    } finally {
      setIsDeleting(null)
    }
  }

  const pinMemory = async (id: string, pinned: boolean) => {
    try {
      setIsPinning(id)
      const response = await fetch(`http://localhost:3001/api/memories/${id}/pin`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned })
      })
      
      const data = await response.json()
      if (data.success) {
        await loadMemories() // Refresh the list
      } else {
        setError(data.error || 'Failed to pin memory')
      }
    } catch (error) {
      setError('Network error: Unable to pin memory')
    } finally {
      setIsPinning(null)
    }
  }

  const resetForm = () => {
    setFormData({
      text: '',
      tags: '',
      importance: 0.5,
      type: 'episodic',
      source: 'plan',
      confidence: 1.0
    })
  }

  const openEditModal = (memory: Memory) => {
    setEditingMemory(memory)
    setFormData({
      text: memory.text,
      tags: memory.tags ? memory.tags.join(', ') : '',
      importance: memory.importance,
      type: memory.type,
      source: memory.source,
      confidence: memory.confidence || 1.0
    })
    setIsEditModalOpen(true)
  }

  // Filter and sort memories
  const getFilteredAndSortedMemories = () => {
    let filtered = searchResults.length > 0 ? searchResults : memories

    // Apply filters - only filter if selections exist
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(memory => selectedTypes.includes(memory.type))
    }
    
    if (selectedSources.length > 0) {
      filtered = filtered.filter(memory => selectedSources.includes(memory.source))
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(memory => 
        memory.tags && memory.tags.some(tag => selectedTags.includes(tag))
      )
    }
    
    if (showPinnedOnly) {
      filtered = filtered.filter(memory => memory.pinned)
    }
    
    if (showBeliefsOnly) {
      filtered = filtered.filter(memory => memory.belief)
    }

    // Apply sorting
    switch (sortBy) {
      case 'recent':
        return filtered.sort((a, b) => b.lastUsed - a.lastUsed)
      case 'oldest':
        return filtered.sort((a, b) => a.lastUsed - b.lastUsed)
      case 'importance':
        return filtered.sort((a, b) => b.importance - a.importance)
      case 'confidence':
        return filtered.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      case 'type':
        return filtered.sort((a, b) => a.type.localeCompare(b.type))
      case 'source':
        return filtered.sort((a, b) => a.source.localeCompare(b.source))
      default:
        return filtered
    }
  }

  const displayMemories = getFilteredAndSortedMemories()

  return (
    <div>
      <Row className="mb-4">
        <Col md={8}>
          <h2 className="text-celestial mb-3">🧠 Memory Dashboard</h2>
          <p className="text-starlight mb-4">
            Access and search through your {memories.length} memories stored in Ouranigon's VSS system.
          </p>
        </Col>
        <Col md={4} className="text-end">
          <Button
            color="success"
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-dragon"
            size="lg"
          >
            ➕ Create Memory
          </Button>
        </Col>
      </Row>

      {/* Search and Filter Section */}
      <Row className="mb-4">
        <Col md={8}>
          <Card className="card-cosmos">
            <CardBody>
              <div className="d-flex gap-2">
                <Input
                  type="text"
                  placeholder="Search memories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchMemories()}
                  className="flex-grow-1"
                />
                <Button 
                  color="primary" 
                  onClick={searchMemories}
                  disabled={isSearching}
                  className="btn-dragon"
                >
                  {isSearching ? <Spinner size="sm" /> : '🔍 Search'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-cosmos">
            <CardBody className="text-center">
              <h5 className="text-celestial">{displayMemories.length}</h5>
              <small className="text-starlight">
                {searchResults.length > 0 ? 'Search Results' : 'Filtered Memories'}
              </small>
              <br />
              <small className="text-muted">of {memories.length} total</small>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Filter Panel */}
      <Row className="mb-4">
        <Col>
          <Card className="card-cosmos">
            <CardHeader className="bg-info text-white">
              <h6 className="mb-0">🔍 Filter & Sort Memories</h6>
            </CardHeader>
            <CardBody>
              {/* Memory Types */}
              <div className="mb-3">
                <label className="form-label small text-celestial fw-bold">Memory Types</label>
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    color={selectedTypes.includes('episodic') ? "warning" : "outline-warning"}
                    onClick={() => toggleType('episodic')}
                    className="text-dark"
                  >
                    🧠 Episodic
                  </Button>
                  <Button
                    size="sm"
                    color={selectedTypes.includes('semantic') ? "primary" : "outline-primary"}
                    onClick={() => toggleType('semantic')}
                    className="text-dark"
                  >
                    🧠 Semantic
                  </Button>
                  <Button
                    size="sm"
                    color={selectedTypes.includes('procedural') ? "success" : "outline-success"}
                    onClick={() => toggleType('procedural')}
                    className="text-dark"
                  >
                    🧠 Procedural
                  </Button>
                </div>
              </div>

              {/* Sources */}
              <div className="mb-3">
                <label className="form-label small text-celestial fw-bold">Sources</label>
                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    color={selectedSources.includes('plan') ? "info" : "outline-info"}
                    onClick={() => toggleSource('plan')}
                    className="text-dark"
                  >
                    📋 Plan
                  </Button>
                  <Button
                    size="sm"
                    color={selectedSources.includes('signal') ? "info" : "outline-info"}
                    onClick={() => toggleSource('signal')}
                    className="text-dark"
                  >
                    📡 Signal
                  </Button>
                  <Button
                    size="sm"
                    color={selectedSources.includes('execution') ? "info" : "outline-info"}
                    onClick={() => toggleSource('execution')}
                    className="text-dark"
                  >
                    ⚡ Execution
                  </Button>
                  <Button
                    size="sm"
                    color={selectedSources.includes('account') ? "info" : "outline-info"}
                    onClick={() => toggleSource('account')}
                    className="text-dark"
                  >
                    💰 Account
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="mb-3">
                <label className="form-label small text-celestial fw-bold">
                  Tags ({getAllTagsWithCounts.length} total)
                </label>
                <div className="d-flex gap-1 flex-wrap" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                  {getAllTagsWithCounts.slice(0, 15).map(({ tag, count }) => (
                    <Button
                      key={tag}
                      size="sm"
                      color={selectedTags.includes(tag) ? "secondary" : "outline-secondary"}
                      onClick={() => toggleTag(tag)}
                      className="text-dark mb-1"
                      style={{ 
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        border: selectedTags.includes(tag) ? '2px solid #6c757d' : '1px solid #6c757d',
                        fontWeight: selectedTags.includes(tag) ? '600' : '400'
                      }}
                    >
                      {tag} <Badge color="light" className="ms-1 text-dark" style={{ fontSize: '0.6rem' }}>
                        {count}
                      </Badge>
                    </Button>
                  ))}
                  {getAllTagsWithCounts.length > 15 && (
                    <Button
                      size="sm"
                      color="outline-light"
                      className="text-dark mb-1"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                    >
                      +{getAllTagsWithCounts.length - 15} more
                    </Button>
                  )}
                </div>
              </div>

              {/* Sort and Quick Filters */}
              <div className="d-flex justify-content-between align-items-end flex-wrap gap-3">
                <div>
                  <label className="form-label small text-celestial fw-bold">Sort By</label>
                  <div className="d-flex gap-1 flex-wrap">
                    {[
                      { value: 'recent', label: '🕒 Recent', color: 'primary' },
                      { value: 'oldest', label: '🕰️ Oldest', color: 'info' },
                      { value: 'importance', label: '⭐ Importance', color: 'warning' },
                      { value: 'confidence', label: '🎯 Confidence', color: 'success' },
                      { value: 'type', label: '📂 Type', color: 'secondary' },
                      { value: 'source', label: '📁 Source', color: 'dark' }
                    ].map(option => (
                      <Button
                        key={option.value}
                        size="sm"
                        color={sortBy === option.value ? option.color : `outline-${option.color}`}
                        onClick={() => setSortBy(option.value)}
                        className="text-dark"
                        style={{
                          fontSize: '0.8rem',
                          padding: '0.375rem 0.75rem',
                          borderRadius: '0.5rem',
                          border: sortBy === option.value ? `2px solid var(--bs-${option.color})` : `1px solid var(--bs-${option.color})`,
                          fontWeight: sortBy === option.value ? '600' : '400',
                          transition: 'all 0.2s ease-in-out',
                          boxShadow: sortBy === option.value ? `0 2px 4px rgba(0,0,0,0.1)` : 'none'
                        }}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="d-flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    color={showPinnedOnly ? "warning" : "outline-warning"}
                    onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                    className="text-dark"
                  >
                    📌 Pinned Only
                  </Button>
                  <Button
                    size="sm"
                    color={showBeliefsOnly ? "success" : "outline-success"}
                    onClick={() => setShowBeliefsOnly(!showBeliefsOnly)}
                    className="text-dark"
                  >
                    ✓ Beliefs Only
                  </Button>
                  <Button
                    size="sm"
                    color="outline-danger"
                    onClick={() => {
                      setSelectedTypes([])
                      setSelectedSources([])
                      setSelectedTags([])
                      setSortBy('recent')
                      setShowPinnedOnly(false)
                      setShowBeliefsOnly(false)
                      setSearchResults([])
                      setSearchQuery('')
                    }}
                    className="text-dark"
                  >
                    🔄 Clear All
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Error Display */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert color="danger" timeout={0}>
              <strong>Connection Error:</strong> {error}
              <br />
              <small>Make sure the MCP Bridge Server is running: <code>npm run bridge</code></small>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Loading State */}
      {isLoading && (
        <Row>
          <Col className="text-center">
            <Spinner color="primary" size="sm" />
            <p className="text-starlight mt-2">Loading memories from Ouranigon MCP...</p>
          </Col>
        </Row>
      )}

      {/* Tab Navigation */}
      {!isLoading && !error && (
        <Row className="mb-3">
          <Col>
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={activeTab === 'list' ? 'active' : ''}
                  onClick={() => setActiveTab('list')}
                  style={{ cursor: 'pointer' }}
                >
                  📋 List View
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === 'graph' ? 'active' : ''}
                  onClick={() => setActiveTab('graph')}
                  style={{ cursor: 'pointer' }}
                >
                  🕸️ Graph View
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={activeTab === 'timeline' ? 'active' : ''}
                  onClick={() => setActiveTab('timeline')}
                  style={{ cursor: 'pointer' }}
                >
                  📊 Reasoning Timeline
                </NavLink>
              </NavItem>
            </Nav>
          </Col>
        </Row>
      )}

      {/* Tab Content */}
      {!isLoading && !error && (
        <TabContent activeTab={activeTab}>
          {/* List View Tab */}
          <TabPane tabId="list">
            <Row>
              <Col md={9}>
                <Card className="card-cosmos">
                  <CardHeader className="bg-info text-white">
                    <h6 className="mb-0">
                      {searchResults.length > 0 ? 'Search Results' : 'Recent Memories'}
                      {searchResults.length > 0 && (
                        <Badge color="light" className="ms-2">{searchResults.length}</Badge>
                      )}
                    </h6>
                  </CardHeader>
                  <CardBody>
                {displayMemories.length === 0 ? (
                  <div className="text-center text-muted">
                    <p>No memories found.</p>
                    {searchResults.length > 0 && (
                      <Button color="outline-secondary" onClick={() => setSearchResults([])}>
                        Show All Memories
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="memory-list">
                    {displayMemories.map((memory) => (
                      <Card key={memory.id} className="mb-3 border-0 bg-transparent">
                        <CardBody className="p-3 border border-secondary rounded">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="d-flex gap-2">
                              <Badge color={getMemoryTypeColor(memory.type)}>
                                {memory.type}
                              </Badge>
                              <Badge color={getImportanceColor(memory.importance)}>
                                {memory.importance.toFixed(2)}
                              </Badge>
                              {memory.confidence && (
                                <Badge color="info">
                                  {(memory.confidence * 100).toFixed(0)}%
                                </Badge>
                              )}
                              <VerificationBadge
                                verification={memoryVerifications.get(memory.id)}
                                onClick={async () => {
                                  const response = await apiService.verifyMemory(memory.id)
                                  if (response.success && response.data) {
                                    setMemoryVerifications(new Map(memoryVerifications.set(memory.id, response.data)))
                                  }
                                }}
                              />
                            </div>
                            <small className="text-muted">
                              {formatDate(memory.lastUsed)}
                            </small>
                          </div>
                          
                          <p className="mb-2 text-dark">{memory.text}</p>
                          
                          {memory.tags && memory.tags.length > 0 && (
                            <div className="mb-2">
                              {memory.tags.map((tag, index) => (
                                <Badge key={index} color="outline-info" className="me-1">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {/* Mini Graph for Connections */}
                          <MemoryMiniGraph
                            memory={memory}
                            maxConnections={3}
                            onConnectionClick={(conn) => {
                              const otherId = conn.sourceId === memory.id ? conn.targetId : conn.sourceId
                              const otherMemory = memories.find(m => m.id === otherId)
                              if (otherMemory) {
                                setSelectedMemoryForConnection(otherMemory)
                                setIsConnectionModalOpen(true)
                              }
                            }}
                          />
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="d-flex gap-2 align-items-center">
                              <small className="text-muted">
                                Source: {memory.source}
                              </small>
                              {(() => {
                                const quality = memoryQualities.get(memory.id)
                                if (!quality) {
                                  // Load quality on demand
                                  apiService.getMemoryQuality(memory.id).then(response => {
                                    if (response.success && response.data) {
                                      setMemoryQualities(new Map(memoryQualities.set(memory.id, response.data)))
                                    }
                                  }).catch(() => {})
                                  return null
                                }
                                return <QualityMetricsComponent metrics={quality} compact />
                              })()}
                            </div>
                            <div className="d-flex gap-1 align-items-center">
                              {memory.belief && (
                                <Badge color="success" size="sm">
                                  ✓ Belief
                                </Badge>
                              )}
                              <Button
                                size="sm"
                                color="outline-info"
                                onClick={async () => {
                                  const response = await apiService.getMemoryConnections(memory.id)
                                  if (response.success && response.data) {
                                    setMemoryConnections(new Map(memoryConnections.set(memory.id, response.data)))
                                  }
                                  setSelectedMemoryForConnection(memory)
                                  setIsConnectionModalOpen(true)
                                }}
                                className="text-dark"
                                style={{ padding: '0.25rem 0.5rem' }}
                                title="View/Add Connections"
                              >
                                🔗
                              </Button>
                              <Button
                                size="sm"
                                color={memory.pinned ? "warning" : "outline-warning"}
                                onClick={() => pinMemory(memory.id, !memory.pinned)}
                                disabled={isPinning === memory.id}
                                className="text-dark"
                                style={{ padding: '0.25rem 0.5rem' }}
                              >
                                {isPinning === memory.id ? <Spinner size="sm" /> : (memory.pinned ? '📌' : '📌')}
                              </Button>
                              <Button
                                size="sm"
                                color="outline-primary"
                                onClick={() => openEditModal(memory)}
                                className="text-dark"
                                style={{ padding: '0.25rem 0.5rem' }}
                              >
                                ✏️
                              </Button>
                              <Button
                                size="sm"
                                color="outline-danger"
                                onClick={() => deleteMemory(memory.id)}
                                disabled={isDeleting === memory.id}
                                className="text-dark"
                                style={{ padding: '0.25rem 0.5rem' }}
                              >
                                {isDeleting === memory.id ? <Spinner size="sm" /> : '🗑️'}
                              </Button>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
          <Col md={3}>
            <NextStepsPanel
              sessionId={currentSessionId || undefined}
              onExecuteSuggestion={(suggestion) => {
                console.log('Execute suggestion:', suggestion)
              }}
            />
          </Col>
        </Row>
          </TabPane>

          {/* Graph View Tab */}
          <TabPane tabId="graph">
            <Row>
              <Col md={8}>
                <MemoryGraph
                  memories={displayMemories}
                  onMemorySelect={(memory) => {
                    setSelectedMemoryForConnection(memory)
                    setIsConnectionModalOpen(true)
                  }}
                />
              </Col>
              <Col md={4}>
                <MemoryMiniList
                  memories={displayMemories}
                  selectedMemoryId={selectedMemoryForConnection?.id}
                  connections={Array.from(memoryConnections.values()).flat()}
                  onMemorySelect={(memory) => {
                    setSelectedMemoryForConnection(memory)
                    setIsConnectionModalOpen(true)
                  }}
                  onConnectionSelect={(conn) => {
                    console.log('Connection selected:', conn)
                  }}
                />
              </Col>
            </Row>
          </TabPane>

          {/* Timeline View Tab */}
          <TabPane tabId="timeline">
            <Row>
              <Col md={8}>
                {currentSessionId ? (
                  <ReasoningTimeline sessionId={currentSessionId} />
                ) : (
                  <Card>
                    <CardBody>
                      <p className="text-muted text-center py-4">
                        No active session. Start a reasoning session to see the timeline.
                      </p>
                    </CardBody>
                  </Card>
                )}
              </Col>
              <Col md={4}>
                <NextStepsPanel
                  sessionId={currentSessionId || undefined}
                  onExecuteSuggestion={(suggestion) => {
                    console.log('Execute suggestion:', suggestion)
                  }}
                />
              </Col>
            </Row>
          </TabPane>
        </TabContent>
      )}

      {/* Connection Modal */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        toggle={() => {
          setIsConnectionModalOpen(false)
          setSelectedMemoryForConnection(null)
        }}
        sourceMemory={selectedMemoryForConnection}
        onSuccess={() => {
          if (selectedMemoryForConnection) {
            apiService.getMemoryConnections(selectedMemoryForConnection.id).then(response => {
              if (response.success && response.data) {
                setMemoryConnections(new Map(memoryConnections.set(selectedMemoryForConnection.id, response.data)))
              }
            })
          }
        }}
      />

      {/* Create Memory Modal */}
      <Modal isOpen={isCreateModalOpen} toggle={() => setIsCreateModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setIsCreateModalOpen(false)}>
          ➕ Create New Memory
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="text">Memory Text *</Label>
              <Input
                type="textarea"
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({...formData, text: e.target.value})}
                rows={4}
                placeholder="Enter your memory content..."
              />
            </FormGroup>
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="tags">Tags</Label>
                  <Input
                    type="text"
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    placeholder="tag1, tag2, tag3"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="type">Type</Label>
                  <Input
                    type="select"
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="episodic">🧠 Episodic</option>
                    <option value="semantic">🧠 Semantic</option>
                    <option value="procedural">🧠 Procedural</option>
                  </Input>
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <FormGroup>
                  <Label for="source">Source</Label>
                  <Input
                    type="select"
                    id="source"
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                  >
                    <option value="plan">📋 Plan</option>
                    <option value="signal">📡 Signal</option>
                    <option value="execution">⚡ Execution</option>
                    <option value="account">💰 Account</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="importance">Importance: {formData.importance}</Label>
                  <Input
                    type="range"
                    id="importance"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.importance}
                    onChange={(e) => setFormData({...formData, importance: parseFloat(e.target.value)})}
                  />
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="confidence">Confidence: {formData.confidence}</Label>
                  <Input
                    type="range"
                    id="confidence"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.confidence}
                    onChange={(e) => setFormData({...formData, confidence: parseFloat(e.target.value)})}
                  />
                </FormGroup>
              </Col>
            </Row>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setIsCreateModalOpen(false)}>
            Cancel
          </Button>
          <Button color="success" onClick={createMemory} disabled={!formData.text.trim()}>
            Create Memory
          </Button>
        </ModalFooter>
      </Modal>

      {/* Edit Memory Modal */}
      <Modal isOpen={isEditModalOpen} toggle={() => setIsEditModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setIsEditModalOpen(false)}>
          ✏️ Edit Memory
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="edit-text">Memory Text *</Label>
              <Input
                type="textarea"
                id="edit-text"
                value={formData.text}
                onChange={(e) => setFormData({...formData, text: e.target.value})}
                rows={4}
                placeholder="Enter your memory content..."
              />
            </FormGroup>
            <Alert color="info" className="small" timeout={0}>
              <strong>Note:</strong> Only the text can be edited. Other properties (tags, type, etc.) are preserved from the original memory.
            </Alert>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setIsEditModalOpen(false)}>
            Cancel
          </Button>
          <Button color="primary" onClick={updateMemory} disabled={!formData.text.trim()}>
            Update Memory
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default MemoryDashboard
