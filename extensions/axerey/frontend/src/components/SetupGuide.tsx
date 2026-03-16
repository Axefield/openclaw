import React, { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Alert, Button, Collapse, Badge } from 'reactstrap'

interface SetupStep {
  id: string
  title: string
  description: string
  code?: string
  completed: boolean
  optional?: boolean
}

const SetupGuide: React.FC = () => {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: '1',
      title: 'Install Dependencies',
      description: 'Make sure all required packages are installed',
      code: 'cd backend\nnpm install',
      completed: false
    },
    {
      id: '2',
      title: 'Run Admin Setup',
      description: 'Create your admin account and generate API keys',
      code: 'npm run setup-admin',
      completed: false
    },
    {
      id: '3',
      title: 'Configure MCP Key',
      description: 'Add your MCP key to the MCP configuration file',
      code: `{
  "mcpServers": {
    "axerey": {
      "command": "node",
      "args": ["C:/Users/p5_pa/axerey/dist/index.js"],
      "env": {
        "PCM_DB": "C:/Users/p5_pa/axerey/pcm.db",
        "MCP_API_KEY": "axerey_YOUR_MCP_KEY_HERE"
      }
    }
  }
}`,
      completed: false
    },
    {
      id: '4',
      title: 'Restart Cursor/Claude Desktop',
      description: 'Restart your IDE to load the new MCP configuration',
      completed: false
    },
    {
      id: '5',
      title: 'Test API Connection',
      description: 'Verify your API key works with the REST API',
      code: 'curl -H "Authorization: Bearer YOUR_API_KEY" http://localhost:3122/api/users/me',
      completed: false,
      optional: true
    }
  ])

  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<string>('')
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    // Check if API key is stored in localStorage
    const storedKey = localStorage.getItem('axerey_api_key')
    if (storedKey) {
      setApiKey(storedKey)
      // Mark step 5 as potentially completed if key exists
      setSteps(prev => prev.map(step => 
        step.id === '5' ? { ...step, completed: true } : step
      ))
    }
  }, [])

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId)
  }

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value)
    localStorage.setItem('axerey_api_key', e.target.value)
  }

  const testApiConnection = async () => {
    if (!apiKey) {
      setTestResult({ success: false, message: 'Please enter an API key first' })
      return
    }

    try {
      // Use the API base URL from environment or default
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3122/api'
      const response = await fetch(`${apiUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTestResult({ 
          success: true, 
          message: `✅ Connection successful! Logged in as: ${data.data?.username || 'User'}` 
        })
        setSteps(prev => prev.map(step => 
          step.id === '5' ? { ...step, completed: true } : step
        ))
      } else {
        const errorData = await response.json().catch(() => ({}))
        setTestResult({ 
          success: false, 
          message: `❌ Connection failed: ${errorData.error || response.statusText || response.status}` 
        })
      }
    } catch (error) {
      setTestResult({ 
        success: false, 
        message: `❌ Error: ${error instanceof Error ? error.message : 'Failed to connect. Make sure the backend server is running on port 3122.'}` 
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    // You could add a toast notification here
  }

  const completedCount = steps.filter(s => s.completed).length
  const totalSteps = steps.length

  return (
    <div className="setup-guide p-4">
      <div className="mb-4">
        <h1 className="display-4 mb-2">🔐 Setup Guide</h1>
        <p className="lead">Get your Axerey system up and running with API keys and MCP configuration</p>
        <div className="progress mb-3" style={{ height: '20px' }}>
          <div 
            className="progress-bar bg-success" 
            role="progressbar" 
            style={{ width: `${(completedCount / totalSteps) * 100}%` }}
          >
            {completedCount} / {totalSteps} steps completed
          </div>
        </div>
      </div>

      <Alert color="warning" className="mb-4">
        <strong>⚠️ Important:</strong> Save your API keys immediately after generation - they won't be shown again!
      </Alert>

      {steps.map((step, index) => (
        <Card key={step.id} className="mb-3">
          <CardHeader 
            className="d-flex justify-content-between align-items-center"
            style={{ cursor: 'pointer' }}
            onClick={() => toggleStep(step.id)}
          >
            <div className="d-flex align-items-center">
              <Badge 
                color={step.completed ? 'success' : 'secondary'} 
                className="me-3"
                style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {step.completed ? '✓' : index + 1}
              </Badge>
              <div>
                <h5 className="mb-0">
                  {step.title}
                  {step.optional && <Badge color="info" className="ms-2">Optional</Badge>}
                </h5>
                <small className="text-muted">{step.description}</small>
              </div>
            </div>
            <span>{expandedStep === step.id ? '▼' : '▶'}</span>
          </CardHeader>
          <Collapse isOpen={expandedStep === step.id}>
            <CardBody>
              {step.code && (
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Code:</strong>
                    <Button 
                      size="sm" 
                      color="secondary"
                      onClick={() => copyToClipboard(step.code!)}
                    >
                      📋 Copy
                    </Button>
                  </div>
                  <pre className="bg-dark text-light p-3 rounded" style={{ fontSize: '0.9rem' }}>
                    <code>{step.code}</code>
                  </pre>
                </div>
              )}

              {step.id === '2' && (
                <Alert color="info">
                  <strong>After running this command:</strong>
                  <ul className="mb-0 mt-2">
                    <li>You'll be prompted for username, email, and password</li>
                    <li>You'll receive an API key and MCP key</li>
                    <li>Save both keys immediately!</li>
                  </ul>
                </Alert>
              )}

              {step.id === '3' && (
                <div>
                  <Alert color="info" className="mb-3">
                    <strong>File location:</strong> <code>claude_desktop_config.json</code> in your project root
                  </Alert>
                  <p>Replace <code>axerey_YOUR_MCP_KEY_HERE</code> with your actual MCP key from step 2.</p>
                </div>
              )}

              {step.id === '5' && (
                <div>
                  <div className="mb-3">
                    <label className="form-label">
                      <strong>Enter your API Key:</strong>
                    </label>
                    <div className="input-group">
                      <input
                        type="password"
                        className="form-control"
                        value={apiKey}
                        onChange={handleApiKeyChange}
                        placeholder="axerey_..."
                      />
                      <Button color="primary" onClick={testApiConnection}>
                        Test Connection
                      </Button>
                    </div>
                    <small className="text-muted">
                      Your API key will be saved locally for future use
                    </small>
                  </div>
                  {testResult && (
                    <Alert color={testResult.success ? 'success' : 'danger'}>
                      {testResult.message}
                    </Alert>
                  )}
                </div>
              )}

              <div className="mt-3">
                <Button 
                  color={step.completed ? 'secondary' : 'success'}
                  onClick={() => {
                    setSteps(prev => prev.map(s => 
                      s.id === step.id ? { ...s, completed: !s.completed } : s
                    ))
                  }}
                >
                  {step.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                </Button>
              </div>
            </CardBody>
          </Collapse>
        </Card>
      ))}

      <Card className="mt-4">
        <CardHeader>
          <h5>📚 Additional Resources</h5>
        </CardHeader>
        <CardBody>
          <ul className="list-unstyled">
            <li className="mb-2">
              <strong>📖 Documentation:</strong>
              <ul>
                <li><code>backend/SETUP_ADMIN.md</code> - Detailed setup instructions</li>
                <li><code>backend/USER_API_SETUP.md</code> - Complete API documentation</li>
                <li><code>API_KEY_CONFIG.md</code> - API key configuration guide</li>
              </ul>
            </li>
            <li className="mb-2">
              <strong>🔗 API Endpoints:</strong>
              <ul>
                <li><code>GET /api/users/me</code> - Get current user info</li>
                <li><code>GET /api/api-keys</code> - List your API keys</li>
                <li><code>POST /api/api-keys</code> - Create new API key</li>
              </ul>
            </li>
            <li>
              <strong>🆘 Need Help?</strong> Check the troubleshooting section in the documentation files.
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}

export default SetupGuide

