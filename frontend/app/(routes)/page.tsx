import Hero from "@/app/components/Hero";
import Features from "@/app/components/Features";
import TechStack from "@/app/components/TechStack";
import CTA from "@/app/components/CTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <Features />
      <TechStack />
      <CTA />
    </div>
  );
}
