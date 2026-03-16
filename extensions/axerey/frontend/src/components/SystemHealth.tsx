import { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Row, Col, Badge, Spinner, Alert, Button } from 'reactstrap'
import { apiService } from '../services/api'

interface SystemHealthData {
  status: string
  timestamp: string
  mcp?: {
    connected: boolean
    pid?: number
  }
  ouranigon?: {
    memoryStore: boolean
    vssStore: boolean
    embeddingProvider: boolean
    mindBalanceTool: boolean
    steelmanTool: boolean
    strawmanTool: boolean
  }
}

const SystemHealth = () => {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkSystemHealth()
    const interval = setInterval(checkSystemHealth, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const checkSystemHealth = async () => {
    try {
      const response = await apiService.getSystemHealth()
      
      if (response.success && response.data) {
        setHealthData(response.data)
        setError(null)
      } else if (!response.success) {
        setError(response.error || 'Health check failed')
        setHealthData(null)
      } else {
        setHealthData(null)
        setError(null)
      }
    } catch (error) {
      setError('Network error: Unable to connect to MCP Bridge Server')
      setHealthData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'success'
      case 'warning': return 'warning'
      case 'error': return 'danger'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      default: return '❓'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div>
      <Row className="mb-4">
        <Col>
          <h2 className="text-celestial mb-3">📊 System Health Dashboard</h2>
          <p className="text-starlight mb-4">
            Real-time monitoring of Ouranigon MCP server and VSS systems.
          </p>
        </Col>
      </Row>

      {/* Error Display */}
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert color="danger" fade={false}>
              <strong>Connection Error:</strong> {error}
              <br />
              <small>Make sure the MCP Bridge Server is running: <code>npm run bridge</code></small>
            </Alert>
          </Col>
        </Row>
      )}

      {/* Loading State */}
      {isLoading && (
        <Row className="mb-4">
          <Col className="text-center">
            <Spinner color="primary" size="sm" />
            <p className="text-starlight mt-2">Checking system health...</p>
          </Col>
        </Row>
      )}

      {/* Health Status */}
      {healthData && (
        <Row className="mb-4">
          <Col md={6}>
            <Card className="card-cosmos">
              <CardHeader className={`bg-${getStatusColor(healthData.status)} text-white`}>
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">
                    {getStatusIcon(healthData.status)} Overall Status
                  </h6>
                  <Badge color="light" className="text-dark">
                    {healthData.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardBody>
                <div className="mb-3">
                  <strong className="text-celestial">Last Check:</strong>
                  <br />
                  <span className="text-starlight">{formatTimestamp(healthData.timestamp)}</span>
                </div>
                
                <div className="mb-3">
                  <strong className="text-celestial">MCP Server:</strong>
                  <br />
                  {healthData.mcp ? (
                    <>
                      <span className={`text-${healthData.mcp.connected ? 'success' : 'danger'}`}>
                        {healthData.mcp.connected ? '✅ Connected' : '❌ Disconnected'}
                      </span>
                      {healthData.mcp.pid != null && (
                        <small className="text-muted d-block">PID: {healthData.mcp.pid}</small>
                      )}
                    </>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
                
                <div className="mt-3">
                  <Button 
                    color="outline-light" 
                    size="sm" 
                    onClick={checkSystemHealth}
                    disabled={isLoading}
                    className="w-100"
                  >
                    {isLoading ? '🔄 Checking...' : '🔄 Refresh Status'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </Col>
          
          <Col md={6}>
            <Card className="card-cosmos">
              <CardHeader className="bg-info text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">🧠 Ouranigon Components</h6>
                  <Button 
                    color="outline-light" 
                    size="sm" 
                    onClick={checkSystemHealth}
                    disabled={isLoading}
                  >
                    {isLoading ? '🔄' : '🔄'}
                  </Button>
                </div>
              </CardHeader>
              <CardBody>
                {healthData.ouranigon ? (
                  <div>
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-starlight">Memory Store:</span>
                      <Badge color={healthData.ouranigon.memoryStore ? 'success' : 'danger'}>
                        {healthData.ouranigon.memoryStore ? '✅' : '❌'}
                      </Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-starlight">VSS Store:</span>
                      <Badge color={healthData.ouranigon.vssStore ? 'success' : 'danger'}>
                        {healthData.ouranigon.vssStore ? '✅' : '❌'}
                      </Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-starlight">Embedding Provider:</span>
                      <Badge color={healthData.ouranigon.embeddingProvider ? 'success' : 'danger'}>
                        {healthData.ouranigon.embeddingProvider ? '✅' : '❌'}
                      </Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-starlight">Mind Balance Tool:</span>
                      <Badge color={healthData.ouranigon.mindBalanceTool ? 'success' : 'danger'}>
                        {healthData.ouranigon.mindBalanceTool ? '✅' : '❌'}
                      </Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-starlight">Steelman Tool:</span>
                      <Badge color={healthData.ouranigon.steelmanTool ? 'success' : 'danger'}>
                        {healthData.ouranigon.steelmanTool ? '✅' : '❌'}
                      </Badge>
                    </div>
                    
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-starlight">Strawman Tool:</span>
                      <Badge color={healthData.ouranigon.strawmanTool ? 'success' : 'danger'}>
                        {healthData.ouranigon.strawmanTool ? '✅' : '❌'}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted">
                    <p>Component status not available</p>
                    <small>MCP Bridge Server may not be fully initialized</small>
                    <div className="mt-3">
                      <Button 
                        color="primary" 
                        size="sm" 
                        onClick={checkSystemHealth}
                        disabled={isLoading}
                        className="btn-dragon"
                      >
                        {isLoading ? '🔄 Initializing...' : '🚀 Initialize Components'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      {/* System Information */}
      <Row>
        <Col>
          <Card className="card-cosmos">
            <CardHeader className="bg-secondary text-white">
              <h6 className="mb-0">ℹ️ System Information</h6>
            </CardHeader>
            <CardBody>
              <Row>
                <Col md={4}>
                  <div className="mb-3">
                    <strong className="text-celestial">Ouranigon MCP Server</strong>
                    <br />
                    <small className="text-starlight">
                      Advanced AI reasoning system with 38+ tools
                    </small>
                  </div>
                </Col>
                
                <Col md={4}>
                  <div className="mb-3">
                    <strong className="text-celestial">VSS Memory System</strong>
                    <br />
                    <small className="text-starlight">
                      Hybrid HNSW + VectorLite with 313 memories
                    </small>
                  </div>
                </Col>
                
                <Col md={4}>
                  <div className="mb-3">
                    <strong className="text-celestial">Web Interface</strong>
                    <br />
                    <small className="text-starlight">
                      Celestial-themed React application
                    </small>
                  </div>
                </Col>
              </Row>
              
              <Row>
                <Col>
                  <div className="mt-3 p-3 bg-dark rounded">
                    <h6 className="text-celestial">Architecture</h6>
                    <p className="text-starlight mb-0">
                      Ouranigon MCP Server ↔ MCP Bridge Server ↔ React Frontend
                    </p>
                    <small className="text-muted">
                      Real-time communication via HTTP/WebSocket protocols
                    </small>
                  </div>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default SystemHealth
