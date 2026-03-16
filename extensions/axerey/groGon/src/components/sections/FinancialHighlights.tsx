import './Section.css';
import './FinancialHighlights.css';

export default function FinancialHighlights() {
  return (
    <section className="section section-alt">
      <div className="container">
        <h2 className="section-title">Financial Projections</h2>
        <div className="financial-content">
          <div className="financial-years grid grid-3">
            <div className="year-card">
              <h3>Year 1</h3>
              <p className="year-label">Material Development & Pilot</p>
              <div className="year-stats">
                <div className="year-stat">
                  <div className="year-stat-label">Revenue</div>
                  <div className="year-stat-value">$50K - $150K</div>
                </div>
                <div className="year-stat">
                  <div className="year-stat-label">Production</div>
                  <div className="year-stat-value">5-10 prototypes</div>
                </div>
                <div className="year-stat">
                  <div className="year-stat-label">Status</div>
                  <div className="year-stat-value">R&D Phase</div>
                </div>
              </div>
            </div>

            <div className="year-card">
              <h3>Year 2</h3>
              <p className="year-label">Early Commercial</p>
              <div className="year-stats">
                <div className="year-stat">
                  <div className="year-stat-label">Revenue</div>
                  <div className="year-stat-value">$300K - $600K</div>
                </div>
                <div className="year-stat">
                  <div className="year-stat-label">Production</div>
                  <div className="year-stat-value">20-40 units</div>
                </div>
                <div className="year-stat">
                  <div className="year-stat-label">Status</div>
                  <div className="year-stat-value">Approaching Break-even</div>
                </div>
              </div>
            </div>

            <div className="year-card">
              <h3>Year 3</h3>
              <p className="year-label">Commercial Scale</p>
              <div className="year-stats">
                <div className="year-stat">
                  <div className="year-stat-label">Revenue</div>
                  <div className="year-stat-value">$750K - $1.5M</div>
                </div>
                <div className="year-stat">
                  <div className="year-stat-label">Production</div>
                  <div className="year-stat-value">50-100 units</div>
                </div>
                <div className="year-stat">
                  <div className="year-stat-label">Net Profit</div>
                  <div className="year-stat-value">$100K - $300K</div>
                </div>
              </div>
            </div>
          </div>

          <div className="financial-highlights">
            <div className="highlight-item">
              <strong>Break-even Timeline:</strong> 30-36 months
            </div>
            <div className="highlight-item">
              <strong>Initial Investment:</strong> $600K - $1.1M
            </div>
            <div className="highlight-item">
              <strong>Model:</strong> Hemp-based sustainable manufacturing
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

