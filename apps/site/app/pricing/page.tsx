import type { Metadata } from "next";
import { FadeIn } from "@/components/landing/fade-in";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { PricingPlans } from "@/components/landing/pricing-plans";
import { SectionSeparator } from "@/components/landing/section-separator";
import { SUPPORT_EMAIL } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Fiyatlandırma",
  description:
    "Lumia.PM için basit fiyatlandırma: ücretsiz başlayın, ekibiniz büyüdükçe Premium'a geçin, kurumsal ihtiyaçlar için bize ulaşın.",
  alternates: {
    canonical: "/pricing",
  },
};

const notes = [
  {
    title: "14 gün ücretsiz deneme",
    body: "Premium plan için kredi kartı bilgisi girmeden 14 gün boyunca tüm özellikleri deneyin.",
  },
  {
    title: "İstediğiniz zaman iptal",
    body: "Aboneliğinizi istediğiniz an iptal edebilirsiniz; planınız faturalandırma döneminin sonuna kadar aktif kalır.",
  },
  {
    title: "Sorularınız mı var?",
    body: "Fiyatlandırma ve faturalandırma sorularınız için bize ulaşın:",
    email: SUPPORT_EMAIL,
  },
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <section className="relative overflow-hidden px-6 pt-14 pb-16 md:pt-20 md:pb-20">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl">
              <FadeIn delay={0}>
                <p className="font-medium text-primary text-sm">
                  Fiyatlandırma
                </p>
              </FadeIn>
              <FadeIn delay={60}>
                <h1 className="mt-3 text-balance text-4xl font-medium leading-[1.06] md:text-5xl">
                  Ücretsiz başlayın.
                  <br />
                  Ekibiniz büyüdükçe siz de büyütün.
                </h1>
              </FadeIn>
              <FadeIn delay={120}>
                <p className="mt-5 text-balance text-foreground/70 text-lg leading-relaxed">
                  Free plan sonsuza dek ücretsizdir. Premium 14 gün ücretsiz
                  denemeyle başlar, kredi kartı gerekmez.
                </p>
              </FadeIn>
            </div>

            <FadeIn delay={200}>
              <div className="mt-12">
                <PricingPlans />
              </div>
            </FadeIn>
          </div>
        </section>

        <SectionSeparator>
          <section className="px-6 py-12 md:py-16">
            <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-3">
              {notes.map((note) => (
                <div key={note.title} className="space-y-2">
                  <h3 className="font-medium text-sm">{note.title}</h3>
                  <p className="text-foreground/70 text-sm leading-relaxed">
                    {note.body}
                    {note.email && (
                      <>
                        {" "}
                        <a
                          className="text-foreground underline underline-offset-4 hover:no-underline"
                          href={`mailto:${note.email}`}
                        >
                          {note.email}
                        </a>
                        .
                      </>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </SectionSeparator>
      </main>
      <Footer />
    </>
  );
}
