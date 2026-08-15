import type { Metadata, Viewport } from "next";
import { Cinzel, Josefin_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Typography pairing per the ui-ux-pro-max-skill dataset, row 32 ("Real
// Estate Luxury" — Best For explicitly lists "architecture, interior
// design"): Cinzel for headings, Josefin Sans for body copy.
const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-heading-cinzel",
  display: "swap",
});

const josefinSans = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans-josefin",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#141414" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://lumiapm.com"),
  title: {
    default: "Lumia.PM - Projeleri aydınlatan yönetim.",
    template: "%s | Lumia.PM",
  },
  description:
    "All you need. Nothing you don't. Open source project management that works for you, not against you.",
  keywords: [
    "lumia.pm",
    "project management",
    "open source",
    "kanban",
    "task management",
    "self-hosted",
    "team collaboration",
  ],
  applicationName: "Lumia.PM",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "https://lumiapm.com",
    siteName: "Lumia.PM",
    title: "Lumia.PM - Projeleri aydınlatan yönetim.",
    description:
      "Open source project management that works for you, not against you. Self-hosted, simple, and powerful.",
    images: [
      {
        url: "/images/hero.png",
        width: 1200,
        height: 630,
        alt: "Lumia.PM",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lumiapm",
    creator: "@lumiapm",
    title: "Lumia.PM - Projeleri aydınlatan yönetim.",
    description:
      "Open source project management that works for you, not against you. Self-hosted, simple, and powerful.",
    images: ["/images/hero.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  category: "productivity",
  creator: "Lumia.PM",
  publisher: "Lumia.PM",
};

const lumiaSocialProfiles = [
  "https://x.com/lumiapm",
  "https://instagram.com/lumiapm",
  "https://linkedin.com/company/lumiapm",
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Lumia.PM",
    url: "https://lumiapm.com",
    logo: "/logo-512.png",
    email: "info@lumiapm.com",
    sameAs: lumiaSocialProfiles,
    brand: {
      "@type": "Brand",
      name: "Lumia.app",
    },
    founder: {
      "@type": "Person",
      name: "Murat Yüksel",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lumia.PM",
    url: "https://lumiapm.com",
    inLanguage: "en",
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Lumia.PM",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Linux, macOS, Windows",
    description:
      "Open source project management that works for you, not against you. Self-hosted, simple, and powerful.",
    url: "https://lumiapm.com",
    image: "https://lumiapm.com/images/hero.png",
    license: "https://github.com/usekaneo/kaneo/blob/main/LICENSE",
  },
];

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${cinzel.variable} ${josefinSans.variable}`}
    >
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
        <Script
          defer
          data-domain="kaneo.app"
          src="https://plausible.kaneo.app/js/script.file-downloads.hash.outbound-links.pageview-props.revenue.tagged-events.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {
            "window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }"
          }
        </Script>
      </body>
    </html>
  );
}
