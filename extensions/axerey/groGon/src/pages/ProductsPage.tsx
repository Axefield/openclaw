import { FaSearch, FaCamera, FaSeedling, FaShieldAlt, FaFlag, FaCheckCircle, FaPlane, FaSatellite } from 'react-icons/fa';
import { IconType } from 'react-icons';
import './ProductsPage.css';

interface Product {
  name: string;
  model: string;
  price: string;
  description: string;
  features: string[];
  specifications: {
    flightTime: string;
    maxSpeed: string;
    range: string;
    camera: string;
    payload?: string;
  };
  icon: IconType;
}

const products: Product[] = [
  {
    name: 'Commercial Inspection Drone',
    model: 'GroGon Inspector Pro',
    price: '$8,000 - $12,000',
    description: 'Professional-grade drone for construction and infrastructure inspection',
    features: [
      '4K UHD camera with 3x optical zoom',
      'Optional thermal imaging',
      '35-40 minute flight time',
      '6-directional obstacle avoidance',
      '30+ mph wind resistance',
      'IP54 weather resistance'
    ],
    specifications: {
      flightTime: '35-40 minutes',
      maxSpeed: '45 mph',
      range: '4.3 miles (7 km)',
      camera: '4K UHD, 20MP, 1-inch CMOS',
      payload: '2.2 lbs (1 kg)'
    },
    icon: FaSearch
  },
  {
    name: 'Real Estate Photography Drone',
    model: 'GroGon Real Estate Pro',
    price: '$3,000 - $5,000',
    description: 'Perfect for real estate agents and photographers',
    features: [
      '4K UHD camera',
      'Automated flight paths (QuickShots)',
      '30 minute flight time',
      '4-directional obstacle avoidance',
      'HDR photography',
      '360° panoramas'
    ],
    specifications: {
      flightTime: '30 minutes',
      maxSpeed: '35 mph',
      range: '4 miles (6.4 km)',
      camera: '4K UHD, 12MP'
    },
    icon: FaCamera
  },
  {
    name: 'Agricultural Monitoring Drone',
    model: 'GroGon Ag Pro',
    price: '$15,000 - $25,000',
    description: 'Advanced precision agriculture solution',
    features: [
      'Multispectral camera (5-band)',
      '50 minute flight time',
      'Weather resistant (IP65)',
      'Real-time NDVI/NDRE calculation',
      'Automated field mapping',
      'RTK positioning option'
    ],
    specifications: {
      flightTime: '50 minutes',
      maxSpeed: '40 mph',
      range: '5 miles (8 km)',
      camera: 'Multispectral + RGB 20MP',
      payload: '4.4 lbs (2 kg)'
    },
    icon: FaSeedling
  },
  {
    name: 'Public Safety Drone',
    model: 'GroGon Public Safety Pro',
    price: '$20,000 - $35,000',
    description: 'Mission-critical drone for law enforcement and emergency services',
    features: [
      'Thermal imaging (FLIR)',
      'Night vision capability',
      '45 minute flight time',
      '360° obstacle avoidance',
      'Encrypted communications',
      'AI person detection'
    ],
    specifications: {
      flightTime: '45 minutes',
      maxSpeed: '50 mph',
      range: '7.5 miles (12 km)',
      camera: '4K + Thermal + 30x zoom',
      payload: '6.6 lbs (3 kg)'
    },
    icon: FaShieldAlt
  }
];

export default function ProductsPage() {
  return (
    <div className="products-page">
      <section className="products-hero">
        <div className="container">
          <h1>Our Products</h1>
          <p className="hero-subtitle">Four specialized drone models for different market segments</p>
          <p className="hero-description">
            All GroGon drones are NDAA-compliant, FAA Part 107 certified, and manufactured in the USA.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="products-list">
            {products.map((product, index) => {
              const IconComponent = product.icon;
              return (
              <div key={index} className="product-detail-card">
                <div className="product-header">
                  <div className="product-icon-large">
                    <IconComponent />
                  </div>
                  <div className="product-header-text">
                    <h2>{product.name}</h2>
                    <p className="product-model">{product.model}</p>
                    <p className="product-price">{product.price}</p>
                  </div>
                </div>
                
                <p className="product-description-full">{product.description}</p>

                <div className="product-details grid grid-2">
                  <div className="product-features-section">
                    <h3>Key Features</h3>
                    <ul className="features-list">
                      {product.features.map((feature, i) => (
                        <li key={i}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="product-specs-section">
                    <h3>Specifications</h3>
                    <dl className="specs-list">
                      <dt>Flight Time</dt>
                      <dd>{product.specifications.flightTime}</dd>
                      <dt>Max Speed</dt>
                      <dd>{product.specifications.maxSpeed}</dd>
                      <dt>Range</dt>
                      <dd>{product.specifications.range}</dd>
                      <dt>Camera</dt>
                      <dd>{product.specifications.camera}</dd>
                      {product.specifications.payload && (
                        <>
                          <dt>Max Payload</dt>
                          <dd>{product.specifications.payload}</dd>
                        </>
                      )}
                    </dl>
                  </div>
                </div>

                <div className="product-cta">
                  <a href="/contact" className="btn btn-primary">
                    Request Quote
                  </a>
                  <a href="/contact" className="btn btn-secondary">
                    Schedule Demo
                  </a>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="compliance-badge">
            <h3>All GroGon Products Include</h3>
            <div className="badges-grid grid grid-4">
              <div className="badge-item">
                <div className="badge-icon">
                  <FaFlag />
                </div>
                <div className="badge-text">Made in USA</div>
              </div>
              <div className="badge-item">
                <div className="badge-icon">
                  <FaCheckCircle />
                </div>
                <div className="badge-text">NDAA Compliant</div>
              </div>
              <div className="badge-item">
                <div className="badge-icon">
                  <FaPlane />
                </div>
                <div className="badge-text">FAA Part 107</div>
              </div>
              <div className="badge-item">
                <div className="badge-icon">
                  <FaSatellite />
                </div>
                <div className="badge-text">FCC Certified</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

