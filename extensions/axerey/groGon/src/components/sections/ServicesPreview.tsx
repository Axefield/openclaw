import { Link } from 'react-router-dom';
import { FaVideo, FaSearch, FaMapMarkedAlt, FaGraduationCap, FaTools } from 'react-icons/fa';
import './Section.css';
import './ServicesPreview.css';

export default function ServicesPreview() {
  const services = [
    {
      name: 'Aerial Photography & Videography',
      price: '$300 - $1,500 per project',
      description: 'Real estate listings, construction progress, events, marketing',
      icon: FaVideo
    },
    {
      name: 'Inspection Services',
      price: '$400 - $2,000 per inspection',
      description: 'Roof inspections, infrastructure surveys, solar panel assessments',
      icon: FaSearch
    },
    {
      name: 'Surveying & Mapping',
      price: '$500 - $3,000 per project',
      description: 'Construction site mapping, agricultural field analysis, topographic surveys',
      icon: FaMapMarkedAlt
    },
    {
      name: 'Training & Certification',
      price: '$200 - $1,000 per person',
      description: 'FAA Part 107 training, drone operation workshops, custom business training',
      icon: FaGraduationCap
    },
    {
      name: 'Maintenance & Support',
      price: '$100 - $500/month',
      description: 'Equipment repairs, software updates, technical support contracts',
      icon: FaTools
    }
  ];

  return (
    <section className="section section-alt">
      <div className="container">
        <h2 className="section-title">Our Services</h2>
        <p className="section-subtitle">Complete drone service solutions for your business</p>
        
        <div className="services-grid grid grid-3">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            return (
            <div key={index} className="service-card">
              <div className="service-icon">
                <IconComponent />
              </div>
              <h3>{service.name}</h3>
              <p className="service-price">{service.price}</p>
              <p className="service-description">{service.description}</p>
            </div>
          );
          })}
        </div>

        <div className="services-cta">
          <Link to="/services" className="btn btn-primary btn-large">
            View All Services
          </Link>
        </div>
      </div>
    </section>
  );
}

