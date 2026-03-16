/**
 * Memory Graph Component
 * 
 * Visualizes memory connections as a graph
 */

import React, { useState, useEffect, useRef } from 'react'
import { Card, CardBody, CardHeader, Button, Badge, Dropdown, DropdownToggle, DropdownMenu, DropdownItem } from 'reactstrap'
import type { Memory, MemoryConnection, ConnectionType } from '../types/index'
import { apiService } from '../services/api'

interface MemoryGraphProps {
  memories: Memory[]
  connections?: MemoryConnection[]
  onMemorySelect?: (memory: Memory) => void
  // onConnectionSelect reserved for future use
}

export const MemoryGraph: React.FC<MemoryGraphProps> = ({
  memories,
  connections: initialConnections,
  onMemorySelect
}) => {
  const [connections, setConnections] = useState<MemoryConnection[]>(initialConnections || [])
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null)
  const [filterType, setFilterType] = useState<ConnectionType | 'all'>('all')
  const [showInferred, setShowInferred] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (initialConnections) {
      setConnections(initialConnections)
    } else if (memories.length > 0) {
      loadConnections()
    }
  }, [memories, initialConnections])

  const loadConnections = async () => {
    try {
      // Load all connections at once (more efficient than per-memory requests)
      const response = await apiService.getAllConnections(2000) // Get up to 2000 connections
      if (response.success && response.data) {
        // Filter to only show connections involving memories in the current view
        const memoryIds = new Set(memories.map(m => m.id))
        const relevantConnections = response.data.filter(conn => 
          memoryIds.has(conn.sourceId) || memoryIds.has(conn.targetId)
        )
        setConnections(relevantConnections)
        console.log(`Loaded ${relevantConnections.length} connections for graph view`)
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
      // Fallback: try loading per-memory if bulk load fails
      const allConnections: MemoryConnection[] = []
      for (const memory of memories.slice(0, 20)) {
        try {
          const response = await apiService.getMemoryConnections(memory.id)
          if (response.success && response.data) {
            allConnections.push(...response.data)
          }
        } catch (err) {
          console.error(`Failed to load connections for memory ${memory.id}:`, err)
        }
      }
      setConnections(allConnections)
    }
  }

  const getFilteredConnections = (): MemoryConnection[] => {
    return connections.filter(conn => {
      if (filterType !== 'all' && conn.connectionType !== filterType) return false
      if (!showInferred && conn.inferred) return false
      return true
    })
  }

  const getConnectionColor = (type: ConnectionType): string => {
    const colors: Record<ConnectionType, string> = {
      supports: '#28a745',
      contradicts: '#dc3545',
      refines: '#17a2b8',
      derives: '#ffc107',
      exemplifies: '#6f42c1',
      generalizes: '#20c997',
      questions: '#fd7e14',
      analyzes: '#007bff',
      synthesizes: '#e83e8c',
      associates: '#6c757d',
      extends: '#6610f2',
      applies: '#20c997'
    }
    return colors[type] || '#6c757d'
  }

  const drawGraph = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight || 600

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const filteredConnections = getFilteredConnections()
    const visibleMemories = new Set<string>()
    filteredConnections.forEach(conn => {
      visibleMemories.add(conn.sourceId)
      visibleMemories.add(conn.targetId)
    })

    const visibleMemoryList = memories.filter(m => visibleMemories.has(m.id))
    if (visibleMemoryList.length === 0) {
      // Draw empty state
      ctx.fillStyle = '#6c757d'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('No connections to display', canvas.width / 2, canvas.height / 2)
      return
    }

    // Simple force-directed layout (circular for now)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.3
    const angleStep = (2 * Math.PI) / visibleMemoryList.length

    const memoryPositions = new Map<string, { x: number; y: number }>()
    visibleMemoryList.forEach((memory, index) => {
      const angle = index * angleStep
      const x = centerX + radius * Math.cos(angle)
      const y = centerY + radius * Math.sin(angle)
      memoryPositions.set(memory.id, { x, y })
    })

    // Draw connections
    filteredConnections.forEach(conn => {
      const sourcePos = memoryPositions.get(conn.sourceId)
      const targetPos = memoryPositions.get(conn.targetId)
      if (!sourcePos || !targetPos) return

      ctx.strokeStyle = getConnectionColor(conn.connectionType)
      ctx.lineWidth = Math.max(1, conn.strength * 5)
      ctx.setLineDash(conn.inferred ? [5, 5] : [])
      ctx.globalAlpha = conn.inferred ? 0.5 : 1.0

      ctx.beginPath()
      ctx.moveTo(sourcePos.x, sourcePos.y)
      ctx.lineTo(targetPos.x, targetPos.y)
      ctx.stroke()

      ctx.setLineDash([])
      ctx.globalAlpha = 1.0
    })

    // Draw memory nodes
    visibleMemoryList.forEach(memory => {
      const pos = memoryPositions.get(memory.id)
      if (!pos) return

      const isSelected = selectedMemory?.id === memory.id
      const radius = isSelected ? 12 : 8

      // Node circle
      ctx.fillStyle = isSelected ? '#007bff' : '#6c757d'
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, radius, 0, 2 * Math.PI)
      ctx.fill()

      // Node border
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Memory text (truncated)
      ctx.fillStyle = '#000'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      const text = memory.text.substring(0, 20) + (memory.text.length > 20 ? '...' : '')
      ctx.fillText(text, pos.x, pos.y + radius + 15)
    })
  }

  useEffect(() => {
    drawGraph()
  }, [memories, connections, selectedMemory, filterType, showInferred])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Simple click detection (would need more sophisticated hit testing in production)
    const filteredConnections = getFilteredConnections()
    const visibleMemories = new Set<string>()
    filteredConnections.forEach(conn => {
      visibleMemories.add(conn.sourceId)
      visibleMemories.add(conn.targetId)
    })

    const visibleMemoryList = memories.filter(m => visibleMemories.has(m.id))
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(canvas.width, canvas.height) * 0.3
    const angleStep = (2 * Math.PI) / visibleMemoryList.length

    visibleMemoryList.forEach((memory, index) => {
      const angle = index * angleStep
      const memX = centerX + radius * Math.cos(angle)
      const memY = centerY + radius * Math.sin(angle)
      const distance = Math.sqrt((x - memX) ** 2 + (y - memY) ** 2)

      if (distance < 20) {
        setSelectedMemory(memory)
        if (onMemorySelect) {
          onMemorySelect(memory)
        }
      }
    })
  }

  const connectionTypes: ConnectionType[] = [
    'supports', 'contradicts', 'refines', 'derives',
    'exemplifies', 'generalizes', 'questions', 'analyzes',
    'synthesizes', 'associates', 'extends', 'applies'
  ]

  return (
    <Card>
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Memory Connections Graph</h6>
          <div className="d-flex gap-2">
            <Dropdown isOpen={false} toggle={() => {}}>
              <DropdownToggle caret size="sm">
                {filterType === 'all' ? 'All Types' : filterType}
              </DropdownToggle>
              <DropdownMenu>
                <DropdownItem onClick={() => setFilterType('all')}>All Types</DropdownItem>
                {connectionTypes.map(type => (
                  <DropdownItem key={type} onClick={() => setFilterType(type)}>
                    {type}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Button
              size="sm"
              color={showInferred ? 'primary' : 'secondary'}
              onClick={() => setShowInferred(!showInferred)}
            >
              {showInferred ? 'Hide' : 'Show'} Inferred
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="position-relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ width: '100%', height: '600px', border: '1px solid #dee2e6', borderRadius: '4px' }}
          />
          {selectedMemory && (
            <div className="position-absolute top-0 end-0 m-3 p-2 bg-white border rounded shadow-sm" style={{ maxWidth: '300px' }}>
              <strong>{selectedMemory.text.substring(0, 50)}...</strong>
              <div className="mt-2">
                <Badge color="info">{selectedMemory.type}</Badge>
                <Badge color="secondary" className="ms-1">
                  {Math.round(selectedMemory.importance * 100)}% important
                </Badge>
              </div>
            </div>
          )}
        </div>
        <div className="mt-3">
          <small className="text-muted">
            {getFilteredConnections().length} connection(s) displayed
            {connections.filter(c => c.inferred).length > 0 && (
              <span className="ms-2">
                ({connections.filter(c => c.inferred).length} inferred)
              </span>
            )}
          </small>
        </div>
      </CardBody>
    </Card>
  )
}

