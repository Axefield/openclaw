/**
 * Reasoning Timeline Component
 * 
 * Displays reasoning steps for a session
 */

import React, { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Badge, Collapse, Button } from 'reactstrap'
import type { ReasoningStep } from '../types/index'
import { apiService } from '../services/api'

interface ReasoningTimelineProps {
  sessionId: string
}

export const ReasoningTimeline: React.FC<ReasoningTimelineProps> = ({ sessionId }) => {
  const [steps, setSteps] = useState<ReasoningStep[]>([])
  const [loading, setLoading] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())
  const [metrics, setMetrics] = useState<{
    totalSteps: number
    completedSteps: number
    failedSteps: number
    averageDuration: number
  } | null>(null)

  useEffect(() => {
    loadTimeline()
  }, [sessionId])

  const loadTimeline = async () => {
    setLoading(true)
    try {
      const traceResponse = await apiService.getReasoningTrace(sessionId)
      if (traceResponse.success && traceResponse.data) {
        setSteps(traceResponse.data.timeline || [])
        setMetrics(traceResponse.data.metrics || null)
      } else {
        // Fallback to steps endpoint
        const stepsResponse = await apiService.getReasoningSteps(sessionId)
        if (stepsResponse.success && stepsResponse.data) {
          setSteps(stepsResponse.data)
        }
      }
    } catch (error) {
      console.error('Failed to load reasoning timeline:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps)
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId)
    } else {
      newExpanded.add(stepId)
    }
    setExpandedSteps(newExpanded)
  }

  const getStatusColor = (status: ReasoningStep['status']): string => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'failed':
        return 'danger'
      case 'in_progress':
        return 'info'
      default:
        return 'secondary'
    }
  }

  const formatDuration = (ms?: number): string => {
    if (!ms) return 'N/A'
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <Card>
      <CardHeader>
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">Reasoning Timeline</h6>
          {metrics && (
            <div className="d-flex gap-2">
              <Badge color="success">{metrics.completedSteps} Completed</Badge>
              {metrics.failedSteps > 0 && (
                <Badge color="danger">{metrics.failedSteps} Failed</Badge>
              )}
              <Badge color="info">{metrics.totalSteps} Total</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {loading ? (
          <div className="text-center py-3">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : steps.length === 0 ? (
          <p className="text-muted text-center py-3">No reasoning steps found for this session</p>
        ) : (
          <div className="timeline">
            {steps.map((step) => {
              const isExpanded = expandedSteps.has(step.stepId)
              return (
                <div key={step.id} className="mb-3 border-start border-3 ps-3" style={{ borderColor: getStatusColor(step.status) }}>
                  <div className="d-flex align-items-start">
                    <Button
                      color="link"
                      className="p-0 me-2"
                      onClick={() => toggleStep(step.stepId)}
                      style={{ minWidth: '20px' }}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </Button>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Badge color={getStatusColor(step.status)}>{step.status}</Badge>
                        <strong>{step.label || step.stepId}</strong>
                        <span className="text-muted small">({step.kind})</span>
                        {step.duration && (
                          <span className="text-muted small ms-auto">
                            {formatDuration(step.duration)}
                          </span>
                        )}
                      </div>
                      {step.description && (
                        <p className="mb-1 small text-muted">{step.description}</p>
                      )}
                      <div className="small text-muted">
                        Started: {formatTime(step.startedAt)}
                        {step.completedAt && ` • Completed: ${formatTime(step.completedAt)}`}
                      </div>
                      <Collapse isOpen={isExpanded}>
                        <div className="mt-2 p-2 bg-light rounded">
                          {step.parents.length > 0 && (
                            <div className="mb-2">
                              <strong>Parents:</strong>{' '}
                              {step.parents.join(', ')}
                            </div>
                          )}
                          {Object.keys(step.details).length > 0 && (
                            <div className="mb-2">
                              <strong>Details:</strong>
                              <pre className="small bg-white p-2 rounded mt-1">
                                {JSON.stringify(step.details, null, 2)}
                              </pre>
                            </div>
                          )}
                          {step.justifications.length > 0 && (
                            <div>
                              <strong>Justifications:</strong>
                              {step.justifications.map((just, idx) => (
                                <div key={idx} className="mt-2 p-2 bg-white rounded">
                                  <div className="small">{just.summary}</div>
                                  {just.timestamp && (
                                    <div className="text-muted small mt-1">
                                      {new Date(just.timestamp).toLocaleString()}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </Collapse>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

