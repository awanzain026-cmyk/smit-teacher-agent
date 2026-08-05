import { LandingNav } from "@/components/landing/landing-nav";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Grounded } from "@/components/landing/grounded";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Grounded />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
