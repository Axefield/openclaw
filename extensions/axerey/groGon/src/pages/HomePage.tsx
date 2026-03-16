import Hero from '../components/sections/Hero';
import ProblemSection from '../components/sections/ProblemSection';
import SolutionSection from '../components/sections/SolutionSection';
import HempProductsSection from '../components/sections/HempProductsSection';
import MarketSection from '../components/sections/MarketSection';
import ProductsPreview from '../components/sections/ProductsPreview';
import ServicesPreview from '../components/sections/ServicesPreview';
import CompetitiveAdvantage from '../components/sections/CompetitiveAdvantage';
import FinancialHighlights from '../components/sections/FinancialHighlights';
import CTA from '../components/sections/CTA';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home-page">
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <HempProductsSection />
      <MarketSection />
      <ProductsPreview />
      <ServicesPreview />
      <CompetitiveAdvantage />
      <FinancialHighlights />
      <CTA />
    </div>
  );
}

