/**
 * Next Steps Panel Component
 * 
 * Displays suggested next reasoning steps
 */

import React, { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, ListGroup, ListGroupItem, Button, Badge } from 'reactstrap'
// Using simple icon instead of lucide-react for compatibility
const RefreshCw = ({ className }: { size?: number; className?: string }) => (
  <span className={className}>🔄</span>
)
import { apiService } from '../services/api'

interface NextStepsPanelProps {
  sessionId?: string
  context?: string
  limit?: number
  onExecuteSuggestion?: (suggestion: string) => void
}

export const NextStepsPanel: React.FC<NextStepsPanelProps> = ({
  sessionId,
  context,
  limit = 3,
  onExecuteSuggestion
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (sessionId) {
      loadSuggestions()
    }
  }, [sessionId, context, limit])

  const loadSuggestions = async () => {
    if (!sessionId) return

    setLoading(true)
    try {
      const response = await apiService.getNextSteps(sessionId, limit, context)
      if (response.success && response.data) {
        setSuggestions(response.data.suggestions || [])
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to load next steps:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadSuggestions()
  }

  const handleExecute = (suggestion: string) => {
    if (onExecuteSuggestion) {
      onExecuteSuggestion(suggestion)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Suggested Next Steps</h6>
          <Button
            color="link"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="p-0"
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </Button>
        </div>
        {lastUpdated && (
          <small className="text-muted">
            Updated: {lastUpdated.toLocaleTimeString()}
          </small>
        )}
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border spinner-border-sm" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-muted text-center py-3 small">
            {sessionId ? 'No suggestions available' : 'Select a session to see suggestions'}
          </p>
        ) : (
          <ListGroup flush>
            {suggestions.map((suggestion, index) => (
              <ListGroupItem key={index} className="d-flex justify-content-between align-items-start">
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Badge color="info" pill>
                      {index + 1}
                    </Badge>
                    <span className="small">{suggestion}</span>
                  </div>
                </div>
                {onExecuteSuggestion && (
                  <Button
                    color="primary"
                    size="sm"
                    onClick={() => handleExecute(suggestion)}
                    className="ms-2"
                  >
                    Execute
                  </Button>
                )}
              </ListGroupItem>
            ))}
          </ListGroup>
        )}
      </CardBody>
    </Card>
  )
}

