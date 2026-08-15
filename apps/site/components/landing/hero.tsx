"use client";

import { AppPreview } from "@/components/landing/app-preview";
import { FadeIn } from "@/components/landing/fade-in";
import { Button } from "@/components/ui/button";
import { appUrl } from "@/lib/app-url";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-14 pb-16 md:pt-20 md:pb-20 lg:pt-24">
      <div className="mx-auto w-full max-w-6xl">
        {/* ── Heading + description + buttons ── */}
        <div className="mb-10 max-w-2xl">
          <FadeIn delay={0}>
            <h1 className="text-balance text-4xl font-medium leading-[1.06] md:text-5xl lg:text-6xl">
              Send a render. Get a{" "}
              <span className="text-primary">decision</span>.
            </h1>
          </FadeIn>
          <FadeIn delay={80}>
            <p className="mt-5 text-balance text-lg text-muted-foreground leading-relaxed md:text-xl">
              Lumia.PM is project management for interior architecture studios:
              plan the work, and send clients a branded link where they approve
              renders without ever seeing your workspace.
            </p>
          </FadeIn>

          <FadeIn delay={160}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="gap-2"
                onClick={() => {
                  window.location.href = appUrl("/auth/sign-up");
                }}
              >
                Start free trial
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => {
                  window.location.href = "/pricing";
                }}
              >
                Pricing
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => {
                  window.location.href = "/about";
                }}
              >
                About Lumia.PM
              </Button>
            </div>
          </FadeIn>
        </div>

        {/* ── App preview: interactive mock of the real Lumia.PM UI ── */}
        <FadeIn delay={240} distance={32}>
          <AppPreview />
        </FadeIn>
      </div>
    </section>
  );
}
