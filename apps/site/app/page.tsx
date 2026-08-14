import { Features } from "@/components/landing/features";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { Modules } from "@/components/landing/modules";
import { Navbar } from "@/components/landing/navbar";
import { SectionSeparator } from "@/components/landing/section-separator";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <Hero />
        <SectionSeparator>
          <Modules />
        </SectionSeparator>
        <SectionSeparator>
          <Features />
        </SectionSeparator>
      </main>
      <Footer />
    </>
  );
}
