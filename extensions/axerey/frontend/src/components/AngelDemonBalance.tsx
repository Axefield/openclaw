import { useState } from 'react'
import { Card, CardBody, CardHeader, Row, Col, Button, FormGroup, Label, Input } from 'reactstrap'
import { apiService } from '../services/api'

interface PhaseSpace {
  theta: number // Ethical grounding angle
  phi: number   // Urgency level angle
  angelSignal: number
  demonSignal: number
  blendedScore: number
  confidence: number
}

const AngelDemonBalance = () => {
  const [theta, setTheta] = useState(45)
  const [phi, setPhi] = useState(30)
  const [result, setResult] = useState<PhaseSpace | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateBalance = async () => {
    setIsCalculating(true)
    
    try {
      const response = await apiService.calculateAngelDemonBalance(
        'Angel vs Demon balance',
        theta,
        phi
      )
      
      if (response.success) {
        setResult(response.data)
      } else {
        console.error('API Error:', response.error)
        // Fallback to local calculation
        const angelSignal = Math.cos(theta * Math.PI / 180)
        const demonSignal = Math.tan(phi * Math.PI / 180)
        const blendedScore = (angelSignal + demonSignal) / 2
        const confidence = Math.abs(angelSignal - demonSignal) < 0.3 ? 0.7 : 0.9
        
        setResult({
          theta,
          phi,
          angelSignal,
          demonSignal,
          blendedScore,
          confidence
        })
      }
    } catch (error) {
      console.error('Network Error:', error)
      // Fallback to local calculation
      const angelSignal = Math.cos(theta * Math.PI / 180)
      const demonSignal = Math.tan(phi * Math.PI / 180)
      const blendedScore = (angelSignal + demonSignal) / 2
      const confidence = Math.abs(angelSignal - demonSignal) < 0.3 ? 0.7 : 0.9
      
      setResult({
        theta,
        phi,
        angelSignal,
        demonSignal,
        blendedScore,
        confidence
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const getRecommendation = (score: number) => {
    if (score > 0.6) return { text: 'PROCEED', color: 'success' }
    if (score < -0.6) return { text: 'AVOID', color: 'danger' }
    return { text: 'CAUTION', color: 'warning' }
  }

  const getSignalStrength = (signal: number) => {
    const abs = Math.abs(signal)
    if (abs > 0.7) return 'Strong'
    if (abs > 0.4) return 'Moderate'
    return 'Weak'
  }

  return (
    <Card className="card-cosmos">
      <CardHeader className="bg-info text-white">
        <h5 className="mb-0">🧮 Angel/Demon Balance</h5>
        <small>Phase-sensitive decision modeling</small>
      </CardHeader>
      <CardBody>
        <Row>
          <Col md={6}>
            <FormGroup>
              <Label for="theta">Theta (θ) - Ethical Grounding</Label>
              <Input
                type="range"
                id="theta"
                min="0"
                max="90"
                value={theta}
                onChange={(e) => setTheta(Number(e.target.value))}
                className="form-range"
              />
              <div className="d-flex justify-content-between">
                <small>0°</small>
                <strong>{theta}°</strong>
                <small>90°</small>
              </div>
            </FormGroup>
            
            <FormGroup>
              <Label for="phi">Phi (φ) - Urgency Level</Label>
              <Input
                type="range"
                id="phi"
                min="0"
                max="90"
                value={phi}
                onChange={(e) => setPhi(Number(e.target.value))}
                className="form-range"
              />
              <div className="d-flex justify-content-between">
                <small>0°</small>
                <strong>{phi}°</strong>
                <small>90°</small>
              </div>
            </FormGroup>
            
            <Button 
              color="primary" 
              onClick={calculateBalance}
              disabled={isCalculating}
              className="btn-dragon w-100"
            >
              {isCalculating ? 'Calculating...' : 'Calculate Balance'}
            </Button>
          </Col>
          
          <Col md={6}>
            {result && (
              <div>
                <h6>Phase Space Analysis</h6>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Angel Signal (cos θ):</span>
                    <span className={`badge bg-${result.angelSignal > 0 ? 'success' : 'danger'}`}>
                      {result.angelSignal.toFixed(3)}
                    </span>
                  </div>
                  <small className="text-muted">
                    {getSignalStrength(result.angelSignal)} {result.angelSignal > 0 ? 'Positive' : 'Negative'}
                  </small>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Demon Signal (tan φ):</span>
                    <span className={`badge bg-${result.demonSignal > 0 ? 'success' : 'danger'}`}>
                      {result.demonSignal.toFixed(3)}
                    </span>
                  </div>
                  <small className="text-muted">
                    {getSignalStrength(result.demonSignal)} {result.demonSignal > 0 ? 'Positive' : 'Negative'}
                  </small>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Blended Score:</span>
                    <span className={`badge bg-${result.blendedScore > 0 ? 'success' : 'danger'}`}>
                      {result.blendedScore.toFixed(3)}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Confidence:</span>
                    <span className="badge bg-info">
                      {(result.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <div className="text-center">
                  <h5 className={`text-${getRecommendation(result.blendedScore).color}`}>
                    {getRecommendation(result.blendedScore).text}
                  </h5>
                  <small className="text-muted">
                    {result.confidence > 0.8 ? 'High confidence decision' : 'Consider additional analysis'}
                  </small>
                </div>
              </div>
            )}
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}

export default AngelDemonBalance
