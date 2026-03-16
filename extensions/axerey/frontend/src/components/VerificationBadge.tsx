/**
 * Verification Badge Component
 * 
 * Displays verification status for memories
 */

import React from 'react'
import { Badge } from 'reactstrap'
import type { VerificationResult } from '../types/index'

interface VerificationBadgeProps {
  verification?: VerificationResult | null
  onClick?: () => void
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({ verification, onClick }) => {
  if (!verification) {
    return (
      <Badge color="secondary" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        Not Verified
      </Badge>
    )
  }

  const getStatusColor = (status: VerificationResult['status']): string => {
    switch (status) {
      case 'verified':
        return 'success'
      case 'partially_verified':
        return 'warning'
      case 'unverified':
        return 'secondary'
      case 'contradicted':
        return 'danger'
      case 'uncertain':
        return 'info'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: VerificationResult['status']): string => {
    switch (status) {
      case 'verified':
        return 'Verified'
      case 'partially_verified':
        return 'Partially Verified'
      case 'unverified':
        return 'Unverified'
      case 'contradicted':
        return 'Contradicted'
      case 'uncertain':
        return 'Uncertain'
      default:
        return 'Unknown'
    }
  }

  return (
    <Badge
      color={getStatusColor(verification.status)}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
      title={`Confidence: ${(verification.confidence * 100).toFixed(0)}%`}
    >
      {getStatusText(verification.status)} ({Math.round(verification.confidence * 100)}%)
    </Badge>
  )
}

