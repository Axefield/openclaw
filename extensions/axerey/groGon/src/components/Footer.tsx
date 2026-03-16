import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
              <div className="footer-section">
                <h3>GroGon</h3>
                <p>Multi-Product Hemp Processing & Drone Manufacturing</p>
                <p className="tagline">From seed to finished product: Hemp seeds, paper, ethanol, bioplastics, and sustainable commercial drones. 100% U.S.-sourced materials.</p>
              </div>

          <div className="footer-section">
            <h4>Products</h4>
            <ul>
              <li><Link to="/products">Commercial Inspection</Link></li>
              <li><Link to="/products">Real Estate</Link></li>
              <li><Link to="/products">Agricultural</Link></li>
              <li><Link to="/products">Public Safety</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Services</h4>
            <ul>
              <li><Link to="/services">Aerial Photography</Link></li>
              <li><Link to="/services">Inspections</Link></li>
              <li><Link to="/services">Surveying</Link></li>
              <li><Link to="/services">Training</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#news">News</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Contact</h4>
            <p>Davie, Florida</p>
            <p>Email: info@groGon.com</p>
            <p>Phone: (555) 123-4567</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2025 GroGon. All rights reserved. | NDAA Compliant | Made in USA</p>
        </div>
      </div>
    </footer>
  );
}

