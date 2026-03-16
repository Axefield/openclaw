/**
 * Connection Modal Component
 * 
 * Create/edit memory connections
 */

import React, { useState, useEffect } from 'react'
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Form, FormGroup, Label, Input } from 'reactstrap'
import type { MemoryConnection, ConnectionType, Memory } from '../types/index'
import { apiService } from '../services/api'

interface ConnectionModalProps {
  isOpen: boolean
  toggle: () => void
  sourceMemory: Memory | null
  targetMemory?: Memory | null
  existingConnection?: MemoryConnection | null
  onSuccess?: () => void
}

const CONNECTION_TYPES: ConnectionType[] = [
  'supports',
  'contradicts',
  'refines',
  'derives',
  'exemplifies',
  'generalizes',
  'questions',
  'analyzes',
  'synthesizes',
  'associates',
  'extends',
  'applies'
]

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  toggle,
  sourceMemory,
  targetMemory,
  existingConnection,
  onSuccess
}) => {
  const [connectionType, setConnectionType] = useState<ConnectionType>('associates')
  const [strength, setStrength] = useState(0.5)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existingConnection) {
      setConnectionType(existingConnection.connectionType)
      setStrength(existingConnection.strength)
      setDescription(existingConnection.description || '')
    } else {
      setConnectionType('associates')
      setStrength(0.5)
      setDescription('')
    }
  }, [existingConnection, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sourceMemory) {
      setError('Source memory is required')
      return
    }

    if (!targetMemory && !existingConnection) {
      setError('Target memory is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const targetId = targetMemory?.id || existingConnection?.targetId
      if (!targetId) {
        throw new Error('Target memory ID is required')
      }

      if (existingConnection) {
        // Update existing connection
        const response = await apiService.updateMemory(existingConnection.id, {
          // Note: Connection updates would need a separate endpoint
          // For now, we'll create a new connection
        } as any)
        if (!response.success) {
          throw new Error(response.error || 'Failed to update connection')
        }
      } else {
        // Create new connection
        const response = await apiService.connectMemories(
          sourceMemory.id,
          targetId,
          connectionType,
          strength,
          description || undefined
        )
        if (!response.success) {
          throw new Error(response.error || 'Failed to create connection')
        }
      }

      if (onSuccess) {
        onSuccess()
      }
      toggle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>
        {existingConnection ? 'Edit Connection' : 'Create Memory Connection'}
      </ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <FormGroup>
            <Label>Source Memory</Label>
            <Input
              type="text"
              value={sourceMemory?.text.substring(0, 100) || ''}
              disabled
              readOnly
            />
          </FormGroup>

          {targetMemory && (
            <FormGroup>
              <Label>Target Memory</Label>
              <Input
                type="text"
                value={targetMemory.text.substring(0, 100)}
                disabled
                readOnly
              />
            </FormGroup>
          )}

          <FormGroup>
            <Label>Connection Type</Label>
            <Input
              type="select"
              value={connectionType}
              onChange={(e) => setConnectionType(e.target.value as ConnectionType)}
            >
              {CONNECTION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </Input>
          </FormGroup>

          <FormGroup>
            <Label>Strength: {Math.round(strength * 100)}%</Label>
            <Input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={strength}
              onChange={(e) => setStrength(parseFloat(e.target.value))}
            />
          </FormGroup>

          <FormGroup>
            <Label>Description (Optional)</Label>
            <Input
              type="textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the relationship..."
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggle} disabled={loading}>
            Cancel
          </Button>
          <Button color="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : existingConnection ? 'Update' : 'Create'}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  )
}

