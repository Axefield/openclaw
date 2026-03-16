import { FaFlag, FaCheckCircle, FaCog, FaHandshake, FaLightbulb, FaLock } from 'react-icons/fa';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="container">
          <h1>About GroGon</h1>
          <p className="hero-subtitle">U.S.-Manufactured Commercial Drones & Services</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="about-content">
            <div className="about-intro">
              <h2>Our Mission</h2>
              <p>
                GroGon is a vertically integrated, multi-product hemp processing and drone manufacturing company 
                launching in Davie, Florida. We produce hemp seeds, paper, ethanol, and bioplastics to generate 
                revenue quickly while developing sustainable drone materials. Our complete supply chain—from seed 
                production to finished products—ensures 100% U.S.-sourced materials, supply chain independence, 
                and environmental responsibility.
              </p>
            </div>

            <div className="about-story">
              <h2>Our Story</h2>
              <p>
                Following the December 23, 2025 FCC ban on foreign-made drones, we recognized the critical 
                need for American-manufactured alternatives. Rather than simply sourcing components domestically, 
                we saw an opportunity to build a truly sustainable, vertically integrated solution. GroGon was 
                founded to produce hemp seeds for farmers, process hemp into multiple products (paper, ethanol, 
                bioplastics), and develop sustainable drone materials—all using 100% U.S.-grown hemp. This 
                multi-product approach generates revenue quickly (3-6 months) while building toward our ultimate 
                goal of manufacturing sustainable commercial drones. Our strategy ensures complete supply chain 
                independence, maximizes value from each ton of hemp, and aligns with growing demand for sustainable 
                technology.
              </p>
            </div>

            <div className="about-location">
              <h2>Based in Davie, Florida</h2>
              <p>
                Located in Davie, Broward County, we're strategically positioned between 
                Miami-Dade, Broward, and Palm Beach counties. This location provides:
              </p>
              <ul>
                <li>Access to major markets across South Florida</li>
                <li>Proximity to agricultural operations in Western Davie</li>
                <li>Strong construction and real estate markets</li>
                <li>Government and public safety opportunities</li>
              </ul>
            </div>

            <div className="about-values">
              <h2>Our Values</h2>
              <div className="values-grid grid grid-3">
                <div className="value-card">
                  <h3><FaFlag /> Made in USA</h3>
                  <p>All products manufactured in the United States with U.S. components</p>
                </div>
                <div className="value-card">
                  <h3><FaCheckCircle /> Compliance First</h3>
                  <p>NDAA, FAA, and FCC compliant products and services</p>
                </div>
                <div className="value-card">
                  <h3><FaCog /> Quality Focus</h3>
                  <p>Rigorous quality control and testing processes</p>
                </div>
                <div className="value-card">
                  <h3><FaHandshake /> Customer Service</h3>
                  <p>Local presence means faster response and better support</p>
                </div>
                <div className="value-card">
                  <h3><FaLightbulb /> Innovation</h3>
                  <p>Continuous improvement through real-world feedback</p>
                </div>
                <div className="value-card">
                  <h3><FaLock /> Security</h3>
                  <p>National security compliance and data protection</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

