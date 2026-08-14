"use client";

import { FadeIn } from "@/components/landing/fade-in";
import { Button } from "@/components/ui/button";
import { SIGN_UP_URL } from "@/lib/site-config";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-14 pb-16 md:pt-20 md:pb-20 lg:pt-24">
      <div className="mx-auto w-full max-w-6xl">
        {/* ── Heading + description + buttons ── */}
        <div className="mb-10 max-w-2xl">
          <FadeIn delay={0}>
            <p className="font-medium text-primary text-sm">
              Mimarlık ve iç mimarlık ofisleri için
            </p>
          </FadeIn>
          <FadeIn delay={40}>
            <h1 className="mt-3 text-balance text-4xl font-medium leading-[1.06] md:text-5xl lg:text-6xl">
              Projeleriniz{" "}
              <span className="text-primary">Excel, e-posta ve WhatsApp</span>{" "}
              arasında kaybolmasın.
            </h1>
          </FadeIn>
          <FadeIn delay={80}>
            <p className="mt-5 text-balance text-lg text-muted-foreground leading-relaxed md:text-xl">
              Lumia.PM; render onayı, malzeme (FF&E) ve tedarik takibi, RFI,
              değişiklik emri, submittal ve ruhsat sürecini tek bir yerde
              toplayan, mesleğinizin dilini konuşan proje yönetim platformu.
            </p>
          </FadeIn>

          <FadeIn delay={160}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => {
                  window.location.href = SIGN_UP_URL;
                }}
              >
                Ücretsiz Dene
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => {
                  window.location.href = "/pricing";
                }}
              >
                Fiyatları Gör
              </Button>
            </div>
            <p className="mt-3 text-muted-foreground text-xs">
              Kredi kartı gerekmez · 14 gün ücretsiz · İstediğiniz zaman iptal
              edin
            </p>
          </FadeIn>
        </div>

        {/* ── Hero visual: a real screenshot of the product ── */}
        <FadeIn delay={240} distance={32}>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-background shadow-2xl ring-1 ring-black/5">
            <img
              src="/screenshots/board.png"
              alt="Lumia.PM proje panosu — mimarlık projesi görevleri sütunlar hâlinde"
              className="w-full"
              width={1440}
              height={900}
            />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
