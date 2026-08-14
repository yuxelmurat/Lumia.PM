"use client";

import { FadeIn } from "@/components/landing/fade-in";
import { Button } from "@/components/ui/button";
import { SIGN_UP_URL } from "@/lib/site-config";

export function FinalCta() {
  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <FadeIn>
          <div className="rounded-2xl border border-border/70 bg-card/70 px-6 py-14 text-center md:px-16 md:py-16">
            <h2 className="text-balance text-3xl font-semibold leading-tight md:text-4xl">
              Bir sonraki projeniz Excel'de değil, Lumia.PM'de başlasın
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground leading-relaxed">
              14 gün ücretsiz deneyin, kredi kartı gerekmez. Beğenmezseniz
              hiçbir şey ödemeden ayrılırsınız.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
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
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
