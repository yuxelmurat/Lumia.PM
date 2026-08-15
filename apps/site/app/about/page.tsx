import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";

export const metadata: Metadata = {
  title: "About",
  description:
    "Who builds Lumia.PM, how to reach us, and where to find us online.",
  alternates: {
    canonical: "/about",
  },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-border/50 py-10 md:grid-cols-[260px_1fr] md:gap-10">
      <h2 className="font-medium text-base">{title}</h2>
      <div className="space-y-4 text-foreground/85 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <section className="relative px-6 pt-14 pb-16 md:pt-20 md:pb-20">
          <div className="mx-auto w-full max-w-6xl">
            <div className="max-w-2xl pb-12">
              <p className="font-medium text-primary text-sm">Company</p>
              <h1 className="mt-3 text-4xl font-medium leading-[1.06] md:text-5xl">
                About Lumia.PM
              </h1>
              <p className="mt-5 text-foreground/85 text-base leading-relaxed">
                Lumia.PM is project management built for interior architecture
                studios: plan projects, run tasks with your team, and share a
                branded, client-facing link so a client can review and approve
                renders without ever seeing your internal workspace.
              </p>
            </div>

            <Section title="The company">
              <p>
                Lumia.PM is a product of{" "}
                <strong className="font-medium text-foreground">
                  Lumia.app
                </strong>
                , a software brand owned and operated by{" "}
                <strong className="font-medium text-foreground">
                  Murat Yüksel
                </strong>{" "}
                as a sole proprietorship (şahıs firması) based in Türkiye.
              </p>
              <p>
                Registered activity (NACE 62.01.01): computer programming
                activities — coding of systems, database, network, and web-page
                software, custom software development for clients, and desktop
                or mobile application development.
              </p>
            </Section>

            <Section title="Lumia.app ecosystem">
              <p>
                Lumia.app is the umbrella brand under which Murat Yüksel builds
                software products. Lumia.PM is the first product in that
                ecosystem, focused on project management for studio-based
                creative and technical teams. Future Lumia.app products will
                share the same account and workspace model.
              </p>
            </Section>

            <Section title="Contact">
              <p>
                Reach the right team directly, or write to the address below for
                anything else:
              </p>
              <ul className="space-y-2">
                <li>
                  <a
                    className="text-foreground underline underline-offset-4 hover:no-underline"
                    href="mailto:sale@lumiapm.com"
                  >
                    sale@lumiapm.com
                  </a>{" "}
                  — pricing, demos, and new accounts
                </li>
                <li>
                  <a
                    className="text-foreground underline underline-offset-4 hover:no-underline"
                    href="mailto:help@lumiapm.com"
                  >
                    help@lumiapm.com
                  </a>{" "}
                  — support for existing customers
                </li>
                <li>
                  <a
                    className="text-foreground underline underline-offset-4 hover:no-underline"
                    href="mailto:info@lumiapm.com"
                  >
                    info@lumiapm.com
                  </a>{" "}
                  — general inquiries, press, and partnerships
                </li>
                <li>
                  <a
                    className="text-foreground underline underline-offset-4 hover:no-underline"
                    href="mailto:murat@lumiapm.com"
                  >
                    murat@lumiapm.com
                  </a>{" "}
                  — direct line to the founder
                </li>
              </ul>
            </Section>

            <Section title="Follow us">
              <p>
                <a
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                  href="https://x.com/lumiapm"
                  target="_blank"
                  rel="noreferrer"
                >
                  X (Twitter)
                </a>
                {" · "}
                <a
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                  href="https://instagram.com/lumiapm"
                  target="_blank"
                  rel="noreferrer"
                >
                  Instagram
                </a>
                {" · "}
                <a
                  className="text-foreground underline underline-offset-4 hover:no-underline"
                  href="https://linkedin.com/company/lumiapm"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn
                </a>
              </p>
            </Section>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
