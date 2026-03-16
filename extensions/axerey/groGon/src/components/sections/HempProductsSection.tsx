import { FaFileAlt, FaGasPump, FaRecycle, FaSeedling } from 'react-icons/fa';
import './Section.css';
import './HempProductsSection.css';

export default function HempProductsSection() {
  const hempProducts = [
    {
      name: 'Hemp Seeds',
      icon: FaSeedling,
      description: 'High-quality industrial hemp seeds for farmers',
      price: '$5 - $8 per pound',
      market: 'Seed distribution to supplier farmers',
      timeline: 'Available immediately',
      benefits: [
        'Quality-controlled genetics',
        'Optimized for fiber production',
        'Builds supplier relationships',
        'Ensures consistent biomass quality'
      ]
    },
    {
      name: 'Hemp Paper',
      icon: FaFileAlt,
      description: 'Sustainable, durable paper from hemp fiber',
      price: '$2,000 - $4,000 per ton',
      market: 'Printing, packaging, stationery companies',
      timeline: '3-6 months to market',
      benefits: [
        'Stronger than wood paper',
        'More durable and recyclable',
        'Premium eco-friendly pricing',
        'Fast-to-market revenue stream'
      ]
    },
    {
      name: 'Hemp Ethanol',
      icon: FaGasPump,
      description: 'Renewable biofuel from hemp biomass',
      price: '$2.50 - $3.50 per gallon',
      market: 'Fuel distributors, gas stations, government',
      timeline: '6-12 months to market',
      benefits: [
        'Renewable energy source',
        'Government incentives available',
        'Growing biofuel market',
        'High-volume potential'
      ]
    },
    {
      name: 'Hemp Bioplastics',
      icon: FaRecycle,
      description: 'Sustainable plastic alternatives from hemp',
      price: '$3,000 - $6,000 per ton',
      market: 'Packaging, consumer goods, automotive',
      timeline: '12-18 months to market',
      benefits: [
        'Replaces petroleum plastics',
        'Biodegradable options',
        'Premium pricing',
        'Multiple applications'
      ]
    }
  ];

  return (
    <section className="section section-alt">
      <div className="container">
        <h2 className="section-title">Our Hemp Products</h2>
        <p className="section-subtitle">
          Multiple revenue streams from sustainable hemp processing. Fast-to-market products generate revenue while we develop drone materials.
        </p>

        <div className="hemp-products-grid grid grid-2">
          {hempProducts.map((product, index) => {
            const IconComponent = product.icon;
            return (
              <div key={index} className="hemp-product-card">
                <div className="hemp-product-icon">
                  <IconComponent />
                </div>
                <h3>{product.name}</h3>
                <p className="hemp-product-description">{product.description}</p>
                <div className="hemp-product-details">
                  <div className="hemp-product-detail">
                    <strong>Price:</strong> {product.price}
                  </div>
                  <div className="hemp-product-detail">
                    <strong>Market:</strong> {product.market}
                  </div>
                  <div className="hemp-product-detail">
                    <strong>Timeline:</strong> {product.timeline}
                  </div>
                </div>
                <ul className="hemp-product-benefits">
                  {product.benefits.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="hemp-products-cta">
          <p className="hemp-products-note">
            All hemp products use 100% U.S.-grown hemp, ensuring complete supply chain independence and supporting American farmers.
          </p>
        </div>
      </div>
    </section>
  );
}

