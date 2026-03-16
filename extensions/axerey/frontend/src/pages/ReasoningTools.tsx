import React, { useState } from 'react'
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap'
import AngelDemonBalance from '../components/AngelDemonBalance'
import ArgumentationTools from '../components/ArgumentationTools'

const ReasoningTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState('balance')

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <h2 className="text-celestial mb-4">🧠 Ouranigon Reasoning Tools</h2>
          <p className="text-starlight mb-4">
            Advanced AI reasoning capabilities with mathematical precision and scientific rigor.
          </p>
        </Col>
      </Row>
      
      {/* Navigation Tabs */}
      <Row className="mb-4">
        <Col>
          <Nav tabs className="nav-tabs-cosmos">
            <NavItem>
              <NavLink
                className={activeTab === 'balance' ? 'active' : ''}
                onClick={() => setActiveTab('balance')}
                style={{ cursor: 'pointer' }}
              >
                🧮 Angel/Demon Balance
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                className={activeTab === 'argumentation' ? 'active' : ''}
                onClick={() => setActiveTab('argumentation')}
                style={{ cursor: 'pointer' }}
              >
                🛡️ Argumentation Analysis
              </NavLink>
            </NavItem>
          </Nav>
        </Col>
      </Row>

      {/* Tab Content */}
      <TabContent activeTab={activeTab}>
        <TabPane tabId="balance">
          <Row>
            <Col md={8}>
              <AngelDemonBalance />
            </Col>
            <Col md={4}>
              <div className="card-cosmos p-3">
                <h6 className="text-celestial">About Angel/Demon Balance</h6>
                <p className="small text-starlight">
                  This tool implements phase-sensitive modeling using theta (θ) and phi (φ) angles 
                  to calculate angel and demon signals through cosine and tangent functions.
                </p>
                <ul className="small text-starlight">
                  <li><strong>Angel Signal:</strong> cos(θ) - Ethical grounding</li>
                  <li><strong>Demon Signal:</strong> tan(φ) - Urgency level</li>
                  <li><strong>Blended Score:</strong> Combined decision metric</li>
                  <li><strong>Confidence:</strong> Decision certainty level</li>
                </ul>
              </div>
            </Col>
          </Row>
        </TabPane>
        
        <TabPane tabId="argumentation">
          <ArgumentationTools />
        </TabPane>
      </TabContent>
    </Container>
  )
}

export default ReasoningTools
