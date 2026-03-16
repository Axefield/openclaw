import { FaHome, FaHardHat, FaSeedling, FaBuilding, FaShieldAlt, FaVideo } from 'react-icons/fa';
import './Section.css';
import './MarketSection.css';

export default function MarketSection() {
  return (
    <section className="section section-alt">
      <div className="container">
        <h2 className="section-title">Market Opportunity</h2>
        <div className="market-content">
          <div className="market-overview">
            <h3>Massive & Growing Market</h3>
            <div className="market-stats">
              <div className="market-stat">
                <div className="market-stat-value">$17.34B</div>
                <div className="market-stat-label">2025 Market Size</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-value">$65.25B</div>
                <div className="market-stat-label">2032 Projected</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-value">20.8%</div>
                <div className="market-stat-label">CAGR</div>
              </div>
              <div className="market-stat">
                <div className="market-stat-value">#4</div>
                <div className="market-stat-label">Florida Ranking</div>
              </div>
            </div>
          </div>

          <div className="target-markets">
            <h3>Target Markets</h3>
            <div className="markets-grid grid grid-2">
              <div className="market-card">
                <h4><FaHome /> Real Estate</h4>
                <p className="market-revenue">$500K+ annually</p>
                <p>Broward County aerial photography for property listings</p>
              </div>
              <div className="market-card">
                <h4><FaHardHat /> Construction</h4>
                <p className="market-revenue">$750K+ annually</p>
                <p>Tri-county area site surveying and progress documentation</p>
              </div>
              <div className="market-card">
                <h4><FaSeedling /> Agriculture</h4>
                <p className="market-revenue">$300K+ annually</p>
                <p>Western Davie and agricultural areas crop monitoring</p>
              </div>
              <div className="market-card">
                <h4><FaBuilding /> Infrastructure</h4>
                <p className="market-revenue">$400K+ annually</p>
                <p>Roof, solar panel, and building inspections</p>
              </div>
              <div className="market-card">
                <h4><FaShieldAlt /> Public Safety</h4>
                <p className="market-revenue">$200K+ annually</p>
                <p>Government contracts for law enforcement and emergency services</p>
              </div>
              <div className="market-card">
                <h4><FaVideo /> Film & Tourism</h4>
                <p className="market-revenue">$250K+ annually</p>
                <p>Aerial cinematography and tourism marketing</p>
              </div>
            </div>
          </div>

          <div className="market-tam">
            <h3>Total Addressable Market</h3>
            <div className="tam-breakdown">
              <div className="tam-item">
                <strong>Local Market (Davie + Surrounding)</strong>
                <p>$3-7M annually</p>
              </div>
              <div className="tam-item">
                <strong>National Manufacturing Market</strong>
                <p>$2-5B annually</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

