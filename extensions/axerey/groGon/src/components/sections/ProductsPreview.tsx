import { Link } from 'react-router-dom';
import { FaSearch, FaCamera, FaSeedling, FaShieldAlt } from 'react-icons/fa';
import './Section.css';
import './ProductsPreview.css';

export default function ProductsPreview() {
  const products = [
    {
      name: 'Commercial Inspection Drone',
      model: 'GroGon Inspector Pro',
      price: '$8,000 - $12,000',
      description: 'Construction and infrastructure inspection',
      features: ['4K camera', 'Thermal option', '35-40 min flight', '6-directional obstacle avoidance'],
      icon: FaSearch
    },
    {
      name: 'Real Estate Photography Drone',
      model: 'GroGon Real Estate Pro',
      price: '$3,000 - $5,000',
      description: 'Real estate agents and photographers',
      features: ['4K camera', 'Automated flight paths', 'Quick setup', 'HDR photography'],
      icon: FaCamera
    },
    {
      name: 'Agricultural Monitoring Drone',
      model: 'GroGon Ag Pro',
      price: '$15,000 - $25,000',
      description: 'Farms and precision agriculture',
      features: ['Multispectral sensors', '50 min flight', 'Weather resistant', 'Crop health analysis'],
      icon: FaSeedling
    },
    {
      name: 'Public Safety Drone',
      model: 'GroGon Public Safety Pro',
      price: '$20,000 - $35,000',
      description: 'Law enforcement and emergency services',
      features: ['Thermal imaging', 'Night vision', 'Encrypted comms', 'AI person detection'],
      icon: FaShieldAlt
    }
  ];

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Our Products</h2>
        <p className="section-subtitle">Four specialized drone models for different market segments</p>
        
        <div className="products-grid grid grid-2">
          {products.map((product, index) => {
            const IconComponent = product.icon;
            return (
            <div key={index} className="product-card">
              <div className="product-icon">
                <IconComponent />
              </div>
              <h3>{product.name}</h3>
              <p className="product-model">{product.model}</p>
              <p className="product-price">{product.price}</p>
              <p className="product-description">{product.description}</p>
              <ul className="product-features">
                {product.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <Link to="/products" className="btn btn-secondary">
                Learn More
              </Link>
            </div>
          );
          })}
        </div>

        <div className="products-cta">
          <Link to="/products" className="btn btn-primary btn-large">
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
}

