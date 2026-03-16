import { Link } from 'react-router-dom';
import './Section.css';
import './CTA.css';

export default function CTA() {
  return (
    <section className="section cta-section">
      <div className="container">
        <div className="cta-content">
          <h2>Ready to Get Started?</h2>
          <p>Join the future of U.S.-manufactured commercial drones</p>
          <div className="cta-buttons">
            <Link to="/contact" className="btn btn-primary btn-large">
              Contact Us
            </Link>
            <Link to="/products" className="btn btn-secondary btn-large">
              View Products
            </Link>
          </div>
          <div className="cta-info">
            <p>Davie, Florida | Made in USA | NDAA Compliant</p>
          </div>
        </div>
      </div>
    </section>
  );
}

