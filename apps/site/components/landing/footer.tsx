import { Logo } from "@/components/landing/logo";
import { SIGN_UP_URL, SUPPORT_EMAIL } from "@/lib/site-config";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-sidebar/70 px-6 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-6xl space-y-10">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <a href="/" aria-label="Lumia.PM anasayfa" className="inline-flex">
              <Logo />
            </a>
            <p className="max-w-sm text-balance text-muted-foreground text-sm">
              Mimarlık ve iç mimarlık ofisleri için proje yönetimi.
            </p>
          </div>

          <div className="col-span-3 grid gap-6 sm:grid-cols-3">
            <div className="space-y-3 text-sm">
              <p className="font-medium">Ürün</p>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href={SIGN_UP_URL}
              >
                Ücretsiz Dene
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/#moduller"
              >
                Modüller
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/pricing"
              >
                Fiyatlandırma
              </a>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-medium">Karşılaştırma</p>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/monday-alternative"
              >
                vs Monday.com
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/asana-alternative"
              >
                vs Asana
              </a>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href="/excel-alternative"
              >
                vs Excel + E-posta
              </a>
            </div>

            <div className="space-y-3 text-sm">
              <p className="font-medium">İletişim</p>
              <a
                className="block text-muted-foreground transition-colors hover:text-foreground"
                href={`mailto:${SUPPORT_EMAIL}`}
              >
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
