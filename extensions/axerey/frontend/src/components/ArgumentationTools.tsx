import React, { useState } from 'react'
import { Card, CardBody, CardHeader, Row, Col, Button, Input, Label, FormGroup, Alert, Spinner, Badge } from 'reactstrap'
import { apiService } from '../services/api'
import type { Objection, Premise } from '../types/index'

interface ArgumentResult {
  originalClaim: string
  improvedClaim?: string
  distortions?: string[]
  premises?: Premise[]
  objections?: Objection[]
  confidence: number
  notes?: string
}

const ArgumentationTools: React.FC = () => {
  const [claim, setClaim] = useState('')
  const [assumptions, setAssumptions] = useState('')
  const [result, setResult] = useState<ArgumentResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisType, setAnalysisType] = useState<'steelman' | 'strawman'>('steelman')
  const [error, setError] = useState<string | null>(null)

  const analyzeArgument = async () => {
    if (!claim.trim()) {
      setError('Please enter a claim to analyze')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const response = analysisType === 'steelman' 
        ? await apiService.steelmanArgument(claim, assumptions.trim() ? assumptions.split(',').map(a => a.trim()) : [])
        : await apiService.strawmanArgument(claim)
      
      if (response.success) {
        setResult(response.data as ArgumentResult)
      } else {
        setError(response.error || 'Analysis failed')
      }
    } catch (error) {
      console.error('Analysis error:', error)
      setError('Network error: Unable to connect to Ouranigon MCP')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'success'
    if (confidence > 0.6) return 'warning'
    return 'danger'
  }

  const getConfidenceText = (confidence: number) => {
    if (confidence > 0.8) return 'High Confidence'
    if (confidence > 0.6) return 'Medium Confidence'
    return 'Low Confidence'
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2 className="text-celestial mb-3">🛡️ Argumentation Analysis</h2>
          <p className="text-starlight mb-4">
            Advanced argument analysis using Ouranigon's sophisticated reasoning tools.
          </p>
        </Col>
      </Row>

      {/* Analysis Type Selection */}
      <Row className="mb-4">
        <Col>
          <Card className="card-cosmos">
            <CardHeader className="bg-info text-white">
              <h6 className="mb-0">Analysis Type</h6>
            </CardHeader>
            <CardBody>
              <div className="d-flex gap-3">
                <Button
                  color={analysisType === 'steelman' ? 'primary' : 'outline-primary'}
                  onClick={() => setAnalysisType('steelman')}
                  className="btn-dragon"
                >
                  🛡️ Steelman Analysis
                </Button>
                <Button
                  color={analysisType === 'strawman' ? 'primary' : 'outline-primary'}
                  onClick={() => setAnalysisType('strawman')}
                  className="btn-dragon"
                >
                  ⚠️ Strawman Analysis
                </Button>
              </div>
              <div className="mt-3">
                <small className="text-muted">
                  {analysisType === 'steelman' ? (
                    <>
                      <strong>Steelman Analysis:</strong> Strengthens the opponent's argument by finding the most charitable interpretation and addressing objections.
                    </>
                  ) : (
                    <>
                      <strong>Strawman Analysis:</strong> Identifies potential distortions and weak points in an argument to test its robustness.
                    </>
                  )}
                </small>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Input Form */}
      <Row className="mb-4">
        <Col md={8}>
          <Card className="card-cosmos">
            <CardHeader className="bg-primary text-white">
              <h6 className="mb-0">Argument Input</h6>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label for="claim">Claim to Analyze</Label>
                <Input
                  type="textarea"
                  id="claim"
                  rows="3"
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  placeholder="Enter the argument or claim you want to analyze..."
                />
              </FormGroup>
              
              <FormGroup>
                <Label for="assumptions">Additional Assumptions (Optional)</Label>
                <Input
                  type="textarea"
                  id="assumptions"
                  rows="2"
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  placeholder="Enter additional assumptions, separated by commas..."
                />
                <small className="text-muted">
                  For Steelman analysis, these will be treated as charitable assumptions.
                </small>
              </FormGroup>
              
              <Button
                color="success"
                onClick={analyzeArgument}
                disabled={isAnalyzing || !claim.trim()}
                className="btn-dragon w-100"
              >
                {isAnalyzing ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Analyzing with Ouranigon MCP...
                  </>
                ) : (
                  `🔍 ${analysisType === 'steelman' ? 'Steelman' : 'Strawman'} Analysis`
                )}
              </Button>
            </CardBody>
          </Card>
        </Col>
        
        <Col md={4}>
          <Card className="card-cosmos">
            <CardHeader className="bg-warning text-dark">
              <h6 className="mb-0">Analysis Info</h6>
            </CardHeader>
            <CardBody>
              <div className="mb-3">
                <strong className="text-celestial">Current Type:</strong>
                <br />
                <span className="text-starlight">
                  {analysisType === 'steelman' ? 'Steelman Analysis' : 'Strawman Analysis'}
                </span>
              </div>
              
              <div className="mb-3">
                <strong className="text-celestial">Purpose:</strong>
                <br />
                <small className="text-starlight">
                  {analysisType === 'steelman' 
                    ? 'Strengthen and improve arguments'
                    : 'Identify weaknesses and distortions'
                  }
                </small>
              </div>
              
              <div>
                <strong className="text-celestial">Data Source:</strong>
                <br />
                <small className="text-starlight">Ouranigon MCP Reasoning Tools</small>
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
              <strong>Analysis Error:</strong> {error}
              <br />
              <small>Make sure the MCP Bridge Server is running: <code>npm run bridge</code></small>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Results Display */}
      {result && (
        <Row>
          <Col>
            <Card className="card-cosmos">
              <CardHeader className={`bg-${getConfidenceColor(result.confidence)} text-white`}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    {analysisType === 'steelman' ? '🛡️ Steelman Analysis Results' : '⚠️ Strawman Analysis Results'}
                  </h6>
                  <Badge color="light" className="text-dark">
                    {getConfidenceText(result.confidence)} ({(result.confidence * 100).toFixed(0)}%)
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <Row>
                  <Col md={6}>
                    <div className="mb-4">
                      <h6 className="text-celestial">Original Claim</h6>
                      <p className="text-starlight bg-dark p-3 rounded">
                        {result.originalClaim}
                      </p>
                    </div>
                    
                    {result.improvedClaim && (
                      <div className="mb-4">
                        <h6 className="text-celestial">Improved Claim</h6>
                        <p className="text-starlight bg-dark p-3 rounded">
                          {result.improvedClaim}
                        </p>
                      </div>
                    )}
                  </Col>
                  
                  <Col md={6}>
                    {result.premises && result.premises.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-celestial">Strengthened Premises</h6>
                        <ul className="text-starlight">
                          {result.premises.map((premise, index) => (
                            <li key={index}>{premise.content}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.distortions && result.distortions.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-celestial">Identified Distortions</h6>
                        <ul className="text-starlight">
                          {result.distortions.map((distortion, index) => (
                            <li key={index}>{distortion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {result.objections && result.objections.length > 0 && (
                      <div className="mb-4">
                        <h6 className="text-celestial">Addressed Objections</h6>
                        <ul className="text-starlight">
                          {result.objections.map((objection, index) => (
                            <li key={index}>{objection.content}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Col>
                </Row>
                
                {result.notes && (
                  <Row>
                    <Col>
                      <div className="mt-4 p-3 bg-dark rounded">
                        <h6 className="text-celestial">Analysis Notes</h6>
                        <p className="text-starlight mb-0">{result.notes}</p>
                      </div>
                    </Col>
                  </Row>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}

export default ArgumentationTools
