/**
 * Mini List Component for Graph View
 * 
 * Shows a compact list of memories in the graph view sidebar
 */

import React, { useState } from 'react'
import { Card, CardBody, CardHeader, ListGroup, ListGroupItem, Badge, Button } from 'reactstrap'
import type { Memory, MemoryConnection } from '../types/index'

interface MemoryMiniListProps {
  memories: Memory[]
  selectedMemoryId?: string
  connections?: MemoryConnection[]
  onMemorySelect?: (memory: Memory) => void
  onConnectionSelect?: (connection: MemoryConnection) => void
}

export const MemoryMiniList: React.FC<MemoryMiniListProps> = ({
  memories,
  selectedMemoryId,
  connections = [],
  onMemorySelect,
  onConnectionSelect
}) => {
  const [expandedMemory, setExpandedMemory] = useState<string | null>(null)

  const getMemoryConnections = (memoryId: string): MemoryConnection[] => {
    return connections.filter(
      c => c.sourceId === memoryId || c.targetId === memoryId
    )
  }

  const getConnectionColor = (type: string): string => {
    const colors: Record<string, string> = {
      supports: '#28a745',
      contradicts: '#dc3545',
      refines: '#17a2b8',
      derives: '#ffc107',
      associates: '#6c757d',
      extends: '#6610f2'
    }
    return colors[type] || '#6c757d'
  }

  return (
    <Card>
      <CardHeader>
        <h6 className="mb-0">Memories ({memories.length})</h6>
      </CardHeader>
      <CardBody className="p-0" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        <ListGroup flush>
          {memories.map((memory) => {
            const memoryConnections = getMemoryConnections(memory.id)
            const isSelected = memory.id === selectedMemoryId
            const isExpanded = expandedMemory === memory.id

            return (
              <ListGroupItem
                key={memory.id}
                active={isSelected}
                style={{
                  cursor: 'pointer',
                  borderLeft: isSelected ? '3px solid #007bff' : 'none'
                }}
                onClick={() => {
                  setExpandedMemory(isExpanded ? null : memory.id)
                  onMemorySelect?.(memory)
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-1 mb-1">
                      <Badge color="info" pill style={{ fontSize: '0.65rem' }}>
                        {memory.type}
                      </Badge>
                      {memoryConnections.length > 0 && (
                        <Badge color="secondary" pill style={{ fontSize: '0.65rem' }}>
                          {memoryConnections.length} conn
                        </Badge>
                      )}
                    </div>
                    <div className="small text-dark" style={{ lineHeight: '1.3' }}>
                      {memory.text.substring(0, 60)}
                      {memory.text.length > 60 && '...'}
                    </div>
                    {memory.tags && memory.tags.length > 0 && (
                      <div className="mt-1">
                        {memory.tags.slice(0, 3).map((tag, idx) => (
                          <Badge
                            key={idx}
                            color="outline-secondary"
                            className="me-1"
                            style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem' }}
                          >
                            {tag}
                          </Badge>
                        ))}
                        {memory.tags.length > 3 && (
                          <Badge color="outline-secondary" style={{ fontSize: '0.6rem' }}>
                            +{memory.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    {isExpanded && memoryConnections.length > 0 && (
                      <div className="mt-2 pt-2 border-top">
                        <small className="text-muted d-block mb-1">Connections:</small>
                        {memoryConnections.slice(0, 5).map((conn) => {
                          return (
                            <Button
                              key={conn.id}
                              size="sm"
                              outline
                              className="me-1 mb-1"
                              style={{
                                fontSize: '0.65rem',
                                padding: '0.1rem 0.3rem',
                                borderColor: getConnectionColor(conn.connectionType),
                                color: getConnectionColor(conn.connectionType)
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                onConnectionSelect?.(conn)
                              }}
                            >
                              {conn.connectionType}
                            </Button>
                          )
                        })}
                        {memoryConnections.length > 5 && (
                          <small className="text-muted d-block mt-1">
                            +{memoryConnections.length - 5} more
                          </small>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </ListGroupItem>
            )
          })}
        </ListGroup>
      </CardBody>
    </Card>
  )
}

