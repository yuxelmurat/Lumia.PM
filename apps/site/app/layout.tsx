import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BRAND_NAME, SITE_URL } from "@/lib/site-config";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

const TAGLINE =
  "Mimarlık ve iç mimarlık ofisleri için proje yönetimi. Onay akışı, FF&E ve tedarik takibi, RFI, değişiklik emri, submittal ve ruhsat takibi tek yerde.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} — Mimarlık ofisleri için proje yönetimi`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: TAGLINE,
  keywords: [
    "mimarlık proje yönetimi",
    "iç mimarlık proje yönetimi",
    "FF&E takibi",
    "RFI takibi",
    "değişiklik emri",
    "submittal takibi",
    "ruhsat takibi",
    "inşaat idaresi yazılımı",
  ],
  applicationName: BRAND_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: BRAND_NAME,
    locale: "tr_TR",
    title: `${BRAND_NAME} — Mimarlık ofisleri için proje yönetimi`,
    description: TAGLINE,
    images: [
      {
        url: "/screenshots/board.png",
        width: 1440,
        height: 900,
        alt: BRAND_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Mimarlık ofisleri için proje yönetimi`,
    description: TAGLINE,
    images: ["/screenshots/board.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/apple-touch-icon.png",
  },
  category: "productivity",
  creator: BRAND_NAME,
  publisher: BRAND_NAME,
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND_NAME,
    url: SITE_URL,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND_NAME,
    url: SITE_URL,
    inLanguage: "tr",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: TAGLINE,
    url: SITE_URL,
    image: `${SITE_URL}/screenshots/board.png`,
  },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: This is necessary to apply the user's preferred color scheme before React hydration to prevent a flash of incorrect theme.
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var media = window.matchMedia('(prefers-color-scheme: dark)');
                  function applyTheme(isDark) {
                    document.documentElement.classList.toggle('dark', isDark);
                    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
                  }
                  applyTheme(media.matches);
                  if (media.addEventListener) {
                    media.addEventListener('change', function(e) { applyTheme(e.matches); });
                  } else if (media.addListener) {
                    media.addListener(function(e) { applyTheme(e.matches); });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data must be inlined as a script tag for search engines to parse.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
