import { Link } from 'react-router-dom';
import './Hero.css';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-overlay"></div>
      </div>
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="hero-title-main">GroGon</span>
            <span className="hero-title-sub">U.S.-Manufactured Commercial Drones & Services</span>
          </h1>
          <p className="hero-tagline">Servicing the United States Security, supply chain independence, and technological autonomy for our nation's critical industries. Serving America.</p>
          <p className="hero-description">
            Multi-product hemp processing facility producing paper, ethanol, and bioplastics while developing 
            sustainable drone materials. Vertically integrated from seed production to finished drones, 
            ensuring 100% U.S.-sourced materials and complete supply chain independence.
          </p>
          <div className="hero-cta">
            <Link to="/products" className="btn btn-primary btn-large">
              View Products
            </Link>
            <Link to="/contact" className="btn btn-secondary btn-large">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

