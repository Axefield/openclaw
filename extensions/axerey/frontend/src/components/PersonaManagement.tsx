import React, { useState, useEffect } from 'react'
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Row, 
  Col, 
  Button, 
  Badge, 
  Spinner, 
  Alert, 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Form, 
  FormGroup, 
  Label, 
  Input,
  Table
} from 'reactstrap'
import type { Persona } from '../types/index'
import { apiService } from '../services/api'

const PersonaManagement: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null)
  const [deletingPersona, setDeletingPersona] = useState<Persona | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    memoryIsolation: true,
    reasoningStyle: 'balanced' as 'balanced' | 'analytical' | 'divergent',
    preferences: {} as Record<string, any>
  })
  
  // Action states
  const [isSwitching, setIsSwitching] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadPersonas()
    loadCurrentPersona()
  }, [])

  const loadPersonas = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiService.getPersonas()
      
      if (response.success && response.data) {
        setPersonas(Array.isArray(response.data) ? response.data : [])
      } else {
        setError(response.error || 'Failed to load personas')
        setPersonas([])
      }
    } catch (error) {
      setError('Network error: Unable to connect to server')
      setPersonas([])
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentPersona = async () => {
    try {
      const response = await apiService.getCurrentPersona()
      if (response.success && response.data) {
        setCurrentPersona(response.data)
      }
    } catch (error) {
      // Silently fail - current persona might not be set
    }
  }

  const handleSwitchPersona = async (personaId: string) => {
    try {
      setIsSwitching(personaId)
      setError(null)
      setSuccess(null)
      
      const response = await apiService.switchPersona(personaId)
      
      if (response.success && response.data) {
        setCurrentPersona(response.data)
        setSuccess(`Switched to ${response.data.name}`)
        // Reload personas to update isActive flags
        await loadPersonas()
      } else {
        setError(response.error || 'Failed to switch persona')
      }
    } catch (error) {
      setError('Network error: Unable to switch persona')
    } finally {
      setIsSwitching(null)
    }
  }

  const handleCreatePersona = () => {
    setFormData({
      name: '',
      description: '',
      memoryIsolation: true,
      reasoningStyle: 'balanced',
      preferences: {}
    })
    setEditingPersona(null)
    setIsCreateModalOpen(true)
  }

  const handleEditPersona = (persona: Persona) => {
    setFormData({
      name: persona.name,
      description: persona.description,
      memoryIsolation: persona.memoryIsolation,
      reasoningStyle: persona.reasoningStyle,
      preferences: persona.preferences || {}
    })
    setEditingPersona(persona)
    setIsEditModalOpen(true)
  }

  const handleDeletePersona = (persona: Persona) => {
    setDeletingPersona(persona)
    setIsDeleteModalOpen(true)
  }

  const generatePersonaId = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleSavePersona = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      if (editingPersona) {
        const personaData = {
          name: formData.name,
          description: formData.description,
          memoryIsolation: formData.memoryIsolation,
          reasoningStyle: formData.reasoningStyle,
          preferences: formData.preferences
        }
        const response = await apiService.updatePersona(editingPersona.id, personaData)
        
        if (response.success) {
          setSuccess('Persona updated successfully')
          setIsEditModalOpen(false)
          setEditingPersona(null)
          await loadPersonas()
          await loadCurrentPersona()
        } else {
          setError(response.error || 'Failed to update persona')
        }
      } else {
        // Create new persona - need to generate ID
        const personaId = generatePersonaId(formData.name)
        const personaData = {
          id: personaId,
          name: formData.name,
          description: formData.description,
          memoryIsolation: formData.memoryIsolation,
          reasoningStyle: formData.reasoningStyle,
          preferences: formData.preferences
        }
        const response = await apiService.createPersona(personaData)
        
        if (response.success) {
          setSuccess('Persona created successfully')
          setIsCreateModalOpen(false)
          await loadPersonas()
          await loadCurrentPersona()
        } else {
          setError(response.error || 'Failed to create persona')
        }
      }

    } catch (error) {
      setError('Network error: Unable to save persona')
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingPersona) return

    try {
      setIsDeleting(true)
      setError(null)
      setSuccess(null)

      const response = await apiService.deletePersona(deletingPersona.id)

      if (response.success) {
        setSuccess('Persona deleted successfully')
        setIsDeleteModalOpen(false)
        setDeletingPersona(null)
        await loadPersonas()
        await loadCurrentPersona()
      } else {
        setError(response.error || 'Failed to delete persona')
      }
    } catch (error) {
      setError('Network error: Unable to delete persona')
    } finally {
      setIsDeleting(false)
    }
  }

  const getReasoningStyleBadge = (style: string) => {
    const colors: Record<string, string> = {
      balanced: 'info',
      analytical: 'primary',
      divergent: 'success'
    }
    return <Badge color={colors[style] || 'secondary'}>{style}</Badge>
  }

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <Spinner color="primary" />
        <p className="mt-3">Loading personas...</p>
      </div>
    )
  }

  return (
    <div className="persona-management">
      <Row>
        <Col>
          <Card>
            <CardHeader className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">🧠 Persona Management</h4>
              <div>
                <Button 
                  color="success" 
                  size="sm" 
                  onClick={handleCreatePersona}
                  className="me-2"
                >
                  ➕ Create Persona
                </Button>
                <Button 
                  color="info" 
                  size="sm" 
                  onClick={loadPersonas}
                >
                  🔄 Refresh
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {error && (
                <Alert color="danger" className="mb-3" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert color="success" className="mb-3" dismissible onClose={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}

              {currentPersona && (
                <Alert color="info" className="mb-3">
                  <strong>Current Persona:</strong> {currentPersona.name} 
                  {currentPersona.description && ` - ${currentPersona.description}`}
                </Alert>
              )}

              {personas.length === 0 ? (
                <Alert color="warning">
                  No personas found. Create your first persona to get started!
                </Alert>
              ) : (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Reasoning Style</th>
                      <th>Memory Isolation</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personas.map((persona) => (
                      <tr key={persona.id}>
                        <td>
                          <strong>{persona.name}</strong>
                        </td>
                        <td>{persona.description || '-'}</td>
                        <td>{getReasoningStyleBadge(persona.reasoningStyle)}</td>
                        <td>
                          {persona.memoryIsolation ? (
                            <Badge color="success">Enabled</Badge>
                          ) : (
                            <Badge color="secondary">Disabled</Badge>
                          )}
                        </td>
                        <td>
                          {persona.isActive ? (
                            <Badge color="primary">Active</Badge>
                          ) : (
                            <Badge color="secondary">Inactive</Badge>
                          )}
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {!persona.isActive && (
                              <Button
                                color="primary"
                                size="sm"
                                onClick={() => handleSwitchPersona(persona.id)}
                                disabled={isSwitching === persona.id}
                              >
                                {isSwitching === persona.id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  'Switch'
                                )}
                              </Button>
                            )}
                            <Button
                              color="warning"
                              size="sm"
                              onClick={() => handleEditPersona(persona)}
                            >
                              ✏️ Edit
                            </Button>
                            <Button
                              color="danger"
                              size="sm"
                              onClick={() => handleDeletePersona(persona)}
                              disabled={persona.isActive}
                            >
                              🗑️ Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Create/Edit Modal */}
      <Modal isOpen={isCreateModalOpen || isEditModalOpen} toggle={() => {
        setIsCreateModalOpen(false)
        setIsEditModalOpen(false)
        setEditingPersona(null)
      }}>
        <ModalHeader toggle={() => {
          setIsCreateModalOpen(false)
          setIsEditModalOpen(false)
          setEditingPersona(null)
        }}>
          {editingPersona ? 'Edit Persona' : 'Create New Persona'}
        </ModalHeader>
        <ModalBody>
          <Form>
            <FormGroup>
              <Label for="personaName">Name *</Label>
              <Input
                type="text"
                id="personaName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Scientific Persona"
                required
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="personaDescription">Description</Label>
              <Input
                type="textarea"
                id="personaDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe this persona's purpose and characteristics"
                rows={3}
              />
            </FormGroup>
            
            <FormGroup>
              <Label for="reasoningStyle">Reasoning Style *</Label>
              <Input
                type="select"
                id="reasoningStyle"
                value={formData.reasoningStyle}
                onChange={(e) => setFormData({ ...formData, reasoningStyle: e.target.value as any })}
              >
                <option value="balanced">Balanced - Balanced analytical approach</option>
                <option value="analytical">Analytical - Rigorous scientific analysis</option>
                <option value="divergent">Divergent - Creative and innovative thinking</option>
              </Input>
            </FormGroup>
            
            <FormGroup check>
              <Label check>
                <Input
                  type="checkbox"
                  checked={formData.memoryIsolation}
                  onChange={(e) => setFormData({ ...formData, memoryIsolation: e.target.checked })}
                />
                {' '}Enable Memory Isolation
              </Label>
              <small className="form-text text-muted d-block">
                When enabled, memories are isolated per persona using tags
              </small>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            color="primary"
            onClick={handleSavePersona}
            disabled={!formData.name || isSaving}
          >
            {isSaving ? <Spinner size="sm" /> : (editingPersona ? 'Update' : 'Create')}
          </Button>
          <Button
            color="secondary"
            onClick={() => {
              setIsCreateModalOpen(false)
              setIsEditModalOpen(false)
              setEditingPersona(null)
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} toggle={() => setIsDeleteModalOpen(false)}>
        <ModalHeader toggle={() => setIsDeleteModalOpen(false)}>
          Confirm Delete
        </ModalHeader>
        <ModalBody>
          Are you sure you want to delete the persona <strong>{deletingPersona?.name}</strong>?
          <br />
          <small className="text-muted">This action cannot be undone.</small>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            onClick={handleConfirmDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Spinner size="sm" /> : 'Delete'}
          </Button>
          <Button
            color="secondary"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default PersonaManagement

