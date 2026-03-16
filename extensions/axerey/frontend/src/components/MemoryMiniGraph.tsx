/**
 * Mini Graph Component for List View
 * 
 * Shows a small graph visualization of connections for a single memory
 */

import React, { useState, useEffect } from 'react'
import { Card, CardBody, Badge, Button } from 'reactstrap'
import type { Memory, MemoryConnection } from '../types/index'
import { apiService } from '../services/api'

interface MemoryMiniGraphProps {
  memory: Memory
  maxConnections?: number
  onConnectionClick?: (connection: MemoryConnection) => void
}

export const MemoryMiniGraph: React.FC<MemoryMiniGraphProps> = ({
  memory,
  maxConnections = 5,
  onConnectionClick
}) => {
  const [connections, setConnections] = useState<MemoryConnection[]>([])
  const [connectedMemories, setConnectedMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadConnections()
  }, [memory.id])

  const loadConnections = async () => {
    setLoading(true)
    try {
      const response = await apiService.getMemoryConnections(memory.id)
      if (response.success && response.data) {
        const conns = response.data.slice(0, maxConnections)
        setConnections(conns)
        
        // Load connected memory details
        const memoryIds = [...new Set([
          ...conns.map(c => c.sourceId),
          ...conns.map(c => c.targetId)
        ])].filter(id => id !== memory.id)
        
        // Fetch memory details (simplified - in production would batch)
        const memoryPromises = memoryIds.slice(0, maxConnections).map(async (id) => {
          try {
            const memResponse = await apiService.getMemory(id)
            return memResponse.success ? memResponse.data : null
          } catch {
            return null
          }
        })
        
        const memories = (await Promise.all(memoryPromises)).filter(Boolean) as Memory[]
        setConnectedMemories(memories)
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConnectionColor = (type: string): string => {
    const colors: Record<string, string> = {
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

  if (loading) {
    return (
      <div className="text-center py-2">
        <small className="text-muted">Loading connections...</small>
      </div>
    )
  }

  if (connections.length === 0) {
    return (
      <div className="text-center py-2">
        <small className="text-muted">No connections</small>
      </div>
    )
  }

  return (
    <Card className="mt-2" style={{ fontSize: '0.85rem' }}>
      <CardBody className="p-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <strong className="small">Connections ({connections.length})</strong>
          <Badge color="info" pill>{connections.length}</Badge>
        </div>
        <div className="d-flex flex-wrap gap-1">
          {connections.map((conn) => {
            const connectedMemory = connectedMemories.find(
              m => m.id === (conn.sourceId === memory.id ? conn.targetId : conn.sourceId)
            )
            const connectionType = conn.connectionType
            const strength = Math.round(conn.strength * 100)
            
            return (
              <Button
                key={conn.id}
                size="sm"
                outline
                color="secondary"
                className="mb-1"
                style={{
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.4rem',
                  borderColor: getConnectionColor(connectionType),
                  color: getConnectionColor(connectionType)
                }}
                onClick={() => onConnectionClick?.(conn)}
                title={`${connectionType} (${strength}%) - ${conn.description || ''}`}
              >
                <span style={{ color: getConnectionColor(connectionType) }}>
                  {connectionType}
                </span>
                {connectedMemory && (
                  <span className="ms-1 text-muted" style={{ fontSize: '0.65rem' }}>
                    ({connectedMemory.text.substring(0, 20)}...)
                  </span>
                )}
              </Button>
            )
          })}
        </div>
        {connections.length > maxConnections && (
          <small className="text-muted d-block mt-1">
            +{connections.length - maxConnections} more connections
          </small>
        )}
      </CardBody>
    </Card>
  )
}

