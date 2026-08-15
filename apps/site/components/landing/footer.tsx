import { Logo } from "@/components/landing/logo";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-sidebar/70 px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <div className="grid gap-10 md:grid-cols-7">
          <div className="space-y-4 md:col-span-2">
            <a href="/" aria-label="Lumia.PM home" className="inline-flex">
              <Logo />
            </a>
            <p className="max-w-sm text-balance text-muted-foreground text-sm">
              All you need. Nothing you don&apos;t.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <a
                className="transition-colors hover:text-foreground"
                href="https://x.com/lumiapm"
                target="_blank"
                rel="noreferrer"
              >
                X
              </a>
              <a
                className="transition-colors hover:text-foreground"
                href="https://instagram.com/lumiapm"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>
              <a
                className="transition-colors hover:text-foreground"
                href="https://linkedin.com/company/lumiapm"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>

          <div className="md:col-span-5 grid gap-6 sm:grid-cols-5">
            <div className="space-y-3 text-sm">
              <p className="font-medium">Product</p>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="https://cloud.kaneo.app"
              >
                Open Cloud
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/docs/core"
              >
                Getting Started
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="#features"
              >
                Features
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/pricing"
              >
                Pricing
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/jira-alternative"
              >
                vs Jira
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/trello-alternative"
              >
                vs Trello
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/linear-alternative"
              >
                vs Linear
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/planka-alternative"
              >
                vs PLANKA
              </a>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-medium">Resources</p>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="https://github.com/usekaneo/kaneo"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="https://github.com/usekaneo/kaneo/blob/main/LICENSE"
                target="_blank"
                rel="noreferrer"
              >
                License
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="https://github.com/usekaneo/kaneo/blob/main/CONTRIBUTING.md"
                target="_blank"
                rel="noreferrer"
              >
                Contributing
              </a>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-medium">Community</p>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="https://discord.com/invite/rU4tSyhXXU"
                target="_blank"
                rel="noreferrer"
              >
                Discord
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="https://github.com/sponsors/andrejsshell"
                target="_blank"
                rel="noreferrer"
              >
                Sponsor
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/docs"
              >
                Documentation
              </a>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-medium">Legal</p>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/privacy"
              >
                Privacy Policy
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/terms"
              >
                Terms of Service
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="mailto:help@lumiapm.com"
              >
                help@lumiapm.com
              </a>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-medium">Company</p>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/about"
              >
                About
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="mailto:info@lumiapm.com"
              >
                info@lumiapm.com
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="mailto:sale@lumiapm.com"
              >
                sale@lumiapm.com
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-border/30 pt-8 text-muted-foreground text-xs leading-relaxed">
          <p>
            Lumia.PM is a Lumia.app ecosystem product. Lumia.app is a brand of
            Murat Yüksel, sole proprietorship (Türkiye) — NACE 62.01.01,
            computer programming activities.
          </p>
        </div>
      </div>
    </footer>
  );
}
