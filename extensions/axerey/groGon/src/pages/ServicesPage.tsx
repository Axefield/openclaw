import { Link } from 'react-router-dom';
import { FaVideo, FaSearch, FaMapMarkedAlt, FaGraduationCap, FaTools, FaFlag, FaCheckCircle, FaBolt, FaChartBar, FaLock, FaBriefcase } from 'react-icons/fa';
import { IconType } from 'react-icons';
import './ServicesPage.css';

const services: Array<{
  name: string;
  price: string;
  description: string;
  features: string[];
  useCases: string[];
  icon: IconType;
}> = [
  {
    name: 'Aerial Photography & Videography',
    price: '$300 - $1,500 per project',
    description: 'High-quality aerial imagery and video for real estate, construction, events, and marketing',
    features: [
      '4K video production',
      'HDR photography',
      '360° panoramas',
      'Virtual property tours',
      'Event coverage',
      'Marketing content'
    ],
    useCases: ['Real estate listings', 'Construction progress', 'Events', 'Marketing campaigns'],
    icon: FaVideo
  },
  {
    name: 'Inspection Services',
    price: '$400 - $2,000 per inspection',
    description: 'Comprehensive drone-based inspections for infrastructure, roofs, and equipment',
    features: [
      'Roof inspections',
      'Solar panel assessments',
      'Infrastructure surveys',
      'Thermal imaging',
      'Detailed reports',
      'Safety compliance'
    ],
    useCases: ['Property inspections', 'Insurance claims', 'Maintenance planning', 'Safety audits'],
    icon: FaSearch
  },
  {
    name: 'Surveying & Mapping',
    price: '$500 - $3,000 per project',
    description: 'Precise surveying and mapping services for construction, agriculture, and development',
    features: [
      'Topographic surveys',
      'Construction site mapping',
      'Agricultural field analysis',
      '3D modeling',
      'Volume calculations',
      'Progress tracking'
    ],
    useCases: ['Site planning', 'Construction documentation', 'Crop monitoring', 'Land development'],
    icon: FaMapMarkedAlt
  },
  {
    name: 'Training & Certification',
    price: '$200 - $1,000 per person',
    description: 'Comprehensive drone training programs for individuals and businesses',
    features: [
      'FAA Part 107 certification prep',
      'Hands-on flight training',
      'Custom business training',
      'Safety protocols',
      'Regulatory compliance',
      'Ongoing support'
    ],
    useCases: ['Pilot certification', 'Team training', 'Safety programs', 'Compliance training'],
    icon: FaGraduationCap
  },
  {
    name: 'Maintenance & Support',
    price: '$100 - $500/month',
    description: 'Ongoing maintenance and technical support for your drone operations',
    features: [
      'Equipment repairs',
      'Software updates',
      'Technical support',
      'Preventive maintenance',
      'Parts replacement',
      'Warranty service'
    ],
    useCases: ['Fleet management', 'Equipment maintenance', 'Technical support', 'Warranty claims'],
    icon: FaTools
  }
];

export default function ServicesPage() {
  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="container">
          <h1>Our Services</h1>
          <p className="hero-subtitle">Complete drone service solutions for your business</p>
          <p className="hero-description">
            Professional drone services using our own U.S.-manufactured, NDAA-compliant equipment.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="services-list">
            {services.map((service, index) => {
              const IconComponent = service.icon;
              return (
              <div key={index} className="service-detail-card">
                <div className="service-header">
                  <div className="service-icon-large">
                    <IconComponent />
                  </div>
                  <div className="service-header-text">
                    <h2>{service.name}</h2>
                    <p className="service-price">{service.price}</p>
                  </div>
                </div>

                <p className="service-description-full">{service.description}</p>

                <div className="service-details grid grid-2">
                  <div className="service-features-section">
                    <h3>What's Included</h3>
                    <ul className="features-list">
                      {service.features.map((feature, i) => (
                        <li key={i}>{feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="service-usecases-section">
                    <h3>Use Cases</h3>
                    <ul className="usecases-list">
                      {service.useCases.map((useCase, i) => (
                        <li key={i}>{useCase}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="service-cta">
                  <Link to="/contact" className="btn btn-primary">
                    Request Service
                  </Link>
                  <Link to="/contact" className="btn btn-secondary">
                    Get Quote
                  </Link>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="service-benefits">
            <h2>Why Choose GroGon Services?</h2>
            <div className="benefits-grid grid grid-3">
              <div className="benefit-item">
                <h3><FaFlag /> U.S. Equipment</h3>
                <p>All services use our own NDAA-compliant drones</p>
              </div>
              <div className="benefit-item">
                <h3><FaCheckCircle /> Certified Pilots</h3>
                <p>FAA Part 107 certified operators with extensive experience</p>
              </div>
              <div className="benefit-item">
                <h3><FaBolt /> Fast Response</h3>
                <p>Local Davie, FL presence means faster service delivery</p>
              </div>
              <div className="benefit-item">
                <h3><FaChartBar /> Quality Reports</h3>
                <p>Detailed reports and data delivered quickly</p>
              </div>
              <div className="benefit-item">
                <h3><FaLock /> Insured & Licensed</h3>
                <p>Fully insured operations with all required licenses</p>
              </div>
              <div className="benefit-item">
                <h3><FaBriefcase /> Business Focus</h3>
                <p>Designed for commercial and professional use</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

