import { Nav } from '@/components/landing/Nav';
import { Hero } from '@/components/landing/Hero';
import { Features, HowItWorks, Security, Closing, Footer } from '@/components/landing/Sections';

export default function Home() {
  return (
    <div className="landing">
      <Nav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Security />
        <Closing />
      </main>
      <Footer />
    </div>
  );
}
