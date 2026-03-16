/**
 * Quality Metrics Component
 * 
 * Displays memory quality metrics
 */

import React from 'react'
import { Card, CardBody, CardHeader, Row, Col, Progress, Badge } from 'reactstrap'
import type { QualityMetrics as QualityMetricsType } from '../types/index'

interface QualityMetricsProps {
  metrics?: QualityMetricsType | null
  compact?: boolean
}

export const QualityMetrics: React.FC<QualityMetricsProps> = ({ metrics, compact = false }) => {
  if (!metrics) {
    return (
      <Badge color="secondary">No Quality Data</Badge>
    )
  }

  if (compact) {
    return (
      <div className="d-flex gap-2">
        <span className="text-muted small">
          Quality: {Math.round(metrics.reliabilityScore * 100)}%
        </span>
      </div>
    )
  }

  const getColor = (value: number): string => {
    if (value >= 0.8) return 'success'
    if (value >= 0.6) return 'info'
    if (value >= 0.4) return 'warning'
    return 'danger'
  }

  return (
    <Card className="mb-3">
      <CardHeader>
        <h6 className="mb-0">Quality Metrics</h6>
      </CardHeader>
      <CardBody>
        <Row>
          <Col md={6}>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <small>Confidence</small>
                <small>{Math.round(metrics.confidence * 100)}%</small>
              </div>
              <Progress
                value={metrics.confidence * 100}
                color={getColor(metrics.confidence)}
                className="mb-2"
              />
            </div>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <small>Relevance</small>
                <small>{Math.round(metrics.relevance * 100)}%</small>
              </div>
              <Progress
                value={metrics.relevance * 100}
                color={getColor(metrics.relevance)}
                className="mb-2"
              />
            </div>
          </Col>
          <Col md={6}>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <small>Quality</small>
                <small>{Math.round(metrics.quality * 100)}%</small>
              </div>
              <Progress
                value={metrics.quality * 100}
                color={getColor(metrics.quality)}
                className="mb-2"
              />
            </div>
            <div className="mb-2">
              <div className="d-flex justify-content-between mb-1">
                <small><strong>Reliability Score</strong></small>
                <small><strong>{Math.round(metrics.reliabilityScore * 100)}%</strong></small>
              </div>
              <Progress
                value={metrics.reliabilityScore * 100}
                color={getColor(metrics.reliabilityScore)}
                className="mb-2"
                style={{ height: '20px' }}
              />
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

