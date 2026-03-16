import { FaRocket, FaShieldAlt, FaIndustry, FaLink, FaBrain, FaSun } from 'react-icons/fa';
import './Section.css';
import './CompetitiveAdvantage.css';

export default function CompetitiveAdvantage() {
  const advantages = [
    {
      title: 'Multi-Product Strategy',
      description: 'Seeds, paper, ethanol, bioplastics, and drones—multiple revenue streams reduce risk and accelerate growth',
      icon: FaRocket
    },
    {
      title: '100% Domestic Supply Chain',
      description: 'From seed production to finished products, complete U.S. sourcing ensures supply chain independence',
      icon: FaShieldAlt
    },
    {
      title: 'Fast-to-Market Revenue',
      description: 'Paper and ethanol generate revenue in 3-12 months while developing drone materials',
      icon: FaIndustry
    },
    {
      title: 'Vertical Integration',
      description: 'Seed production, processing, manufacturing, and services create a defensible competitive moat',
      icon: FaLink
    },
    {
      title: 'Biomass Efficiency',
      description: 'Maximize value from each ton of hemp across multiple products and applications',
      icon: FaBrain
    },
    {
      title: 'Sustainable Innovation',
      description: 'Carbon-negative process, renewable materials, ESG-aligned for conscious customers and investors',
      icon: FaSun
    }
  ];

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">Why GroGon Will Win</h2>
        <div className="advantages-grid grid grid-3">
          {advantages.map((advantage, index) => {
            const IconComponent = advantage.icon;
            return (
            <div key={index} className="advantage-card">
              <div className="advantage-icon">
                <IconComponent />
              </div>
              <h3>{advantage.title}</h3>
              <p>{advantage.description}</p>
            </div>
          );
          })}
        </div>
      </div>
    </section>
  );
}

