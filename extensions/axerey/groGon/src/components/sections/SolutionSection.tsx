import { FaIndustry, FaHelicopter } from 'react-icons/fa';
import './Section.css';

export default function SolutionSection() {
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">The Solution</h2>
        <div className="solution-content">
          <div className="solution-intro">
            <h3>GroGon: Multi-Product Hemp Processing + Drone Manufacturing</h3>
            <p className="solution-tagline">
              Fast-to-market strategy: Hemp paper, ethanol, and bioplastics generate revenue while we develop sustainable drone materials
            </p>
          </div>

          <div className="solution-model grid grid-2">
            <div className="model-card">
              <div className="model-icon">
                <FaIndustry />
              </div>
              <h4>Hemp Processing Products</h4>
              <p>Multiple revenue streams: Seeds, Paper, Ethanol, Bioplastics</p>
              <ul>
                <li>Hemp seeds: Quality-controlled distribution to farmers</li>
                <li>Hemp paper: Fast-to-market, 3-6 months ($2K-$4K/ton)</li>
                <li>Hemp ethanol: Biofuel, 6-12 months ($2.50-$3.50/gal)</li>
                <li>Hemp bioplastics: Sustainable plastics, 12-18 months</li>
                <li>Revenue funds drone development</li>
              </ul>
            </div>

            <div className="model-card">
              <div className="model-icon">
                <FaHelicopter />
              </div>
              <h4>Drone Manufacturing & Services</h4>
              <p>Commercial drones using hemp composites + service operations</p>
              <ul>
                <li>Hemp composite materials for drones</li>
                <li>4 specialized drone models ($3K-$35K)</li>
                <li>Aerial photography & inspections</li>
                <li>100% U.S.-sourced materials</li>
                <li>NDAA-compliant, government eligible</li>
              </ul>
            </div>
          </div>

          <div className="solution-synergies">
            <h4>Key Synergies:</h4>
            <div className="synergy-grid grid grid-3">
              <div className="synergy-item">
                <strong>Fast Revenue</strong>
                <p>Paper and ethanol generate revenue in 3-12 months</p>
              </div>
              <div className="synergy-item">
                <strong>Biomass Efficiency</strong>
                <p>Maximize value from each ton of hemp across products</p>
              </div>
              <div className="synergy-item">
                <strong>R&D Funding</strong>
                <p>Early product revenue funds drone development</p>
              </div>
              <div className="synergy-item">
                <strong>Supply Chain Control</strong>
                <p>Seed production ensures quality and supplier relationships</p>
              </div>
              <div className="synergy-item">
                <strong>Market Diversification</strong>
                <p>Multiple products reduce risk and increase opportunities</p>
              </div>
              <div className="synergy-item">
                <strong>Vertical Integration</strong>
                <p>From seed to finished product, complete control</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

