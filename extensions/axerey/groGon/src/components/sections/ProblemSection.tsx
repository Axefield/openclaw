import './Section.css';

export default function ProblemSection() {
  return (
    <section className="section section-alt">
      <div className="container">
        <h2 className="section-title">The Problem</h2>
        <div className="problem-content">
          <div className="problem-main">
            <h3 className="problem-headline">Critical Need for Domestic Supply Chain</h3>
            <p className="problem-date">December 23, 2025</p>
            <p className="problem-text">
              The FCC ban on foreign-made drones created an immediate need for American-manufactured alternatives. 
              With 70-80% of the commercial drone market previously dependent on foreign suppliers, American businesses 
              now require U.S.-made solutions to maintain operations. This critical supply chain gap affects 
              real estate, construction, agriculture, and public safety sectors that depend on reliable, 
              secure, and domestically-produced drone technology.
            </p>
          </div>
          
          <div className="problem-stats">
            <div className="stat-card">
              <div className="stat-number">70-80%</div>
              <div className="stat-label">Market Requiring U.S. Alternatives</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100,000+</div>
              <div className="stat-label">Replacement Units Needed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">$17.34B</div>
              <div className="stat-label">Market Size (2025)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">$65.25B</div>
              <div className="stat-label">Projected (2032)</div>
            </div>
          </div>

          <div className="problem-impact">
            <h4>Impact on Industries:</h4>
            <ul className="impact-list">
              <li>Real estate agents can't get replacement drones for property photography</li>
              <li>Construction companies face delays in site surveying</li>
              <li>Agricultural operations lose precision farming capabilities</li>
              <li>Public safety agencies need NDAA-compliant alternatives</li>
              <li>Government contracts require U.S.-manufactured products</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

