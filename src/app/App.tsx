import { useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ProductsSection } from './components/ProductsSection';
import { CustomizationSection } from './components/CustomizationSection';
import { AuthSection } from './components/AuthSection';
import { BenefitsSection } from './components/BenefitsSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { Footer } from './components/Footer';

export default function App() {
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <HeroSection />
        <ProductsSection
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
        />
        <CustomizationSection selectedProductId={selectedProductId} />
        <AuthSection />
        <BenefitsSection />
        <HowItWorksSection />
      </main>
      <Footer />
    </div>
  );
}
