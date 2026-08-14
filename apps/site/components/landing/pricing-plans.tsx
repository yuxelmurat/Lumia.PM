"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { SIGN_UP_URL, SUPPORT_EMAIL } from "@/lib/site-config";

type Interval = "monthly" | "annual";

type Plan = {
  name: string;
  tagline: string;
  monthly: { price: string; suffix: string; note: string };
  annual: { price: string; suffix: string; note: string };
  features: string[];
  cta: { href: string; label: string };
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    tagline: "Ürünü denemek için",
    monthly: {
      price: "₺0",
      suffix: "sonsuza dek",
      note: "Kredi kartı gerekmez",
    },
    annual: {
      price: "₺0",
      suffix: "sonsuza dek",
      note: "Kredi kartı gerekmez",
    },
    features: [
      "3 kullanıcıya kadar",
      "2 aktif proje",
      "1 GB depolama",
      "Kanban, Gantt, zaman takibi",
      "Temel malzeme (FF&E) listesi",
      "Topluluk desteği",
    ],
    cta: { href: SIGN_UP_URL, label: "Ücretsiz Başla" },
  },
  {
    name: "Premium",
    tagline: "Aktif çalışan ofisler için",
    monthly: {
      price: "₺349",
      suffix: "/ kullanıcı / ay",
      note: "Aylık faturalandırma",
    },
    annual: {
      price: "₺3.490",
      suffix: "/ kullanıcı / yıl",
      note: "₺291 / kullanıcı / ay, yıllık faturalandırma",
    },
    features: [
      "15 kullanıcıya kadar",
      "Sınırsız proje",
      "50 GB depolama",
      "RFI, değişiklik emri, submittal, ruhsat takibi",
      "Kapasite (workload) görünümü",
      "DWG görüntüleyici",
      "Proje şablonları ve faz bütçesi",
      "Entegrasyonlar (Slack, GitHub, vb.)",
      "E-posta destek",
    ],
    cta: { href: `${SIGN_UP_URL}?plan=premium`, label: "14 gün ücretsiz dene" },
    highlighted: true,
  },
  {
    name: "Kurumsal",
    tagline: "Büyük ofisler ve kendi sunucunuz için",
    monthly: {
      price: "Bize ulaşın",
      suffix: "",
      note: "Ekip büyüklüğüne göre",
    },
    annual: { price: "Bize ulaşın", suffix: "", note: "Ekip büyüklüğüne göre" },
    features: [
      "Sınırsız kullanıcı ve depolama",
      "Kendi sunucunuzda çalıştırma seçeneği",
      "SSO / tek oturum açma",
      "Özel rol ve izin yapıları",
      "Öncelikli destek ve SLA",
      "Özel hesap yöneticisi",
    ],
    cta: {
      href: `mailto:${SUPPORT_EMAIL}?subject=Kurumsal%20plan`,
      label: "Bize ulaşın",
    },
  },
];

export function PricingPlans() {
  const [interval, setInterval] = useState<Interval>("annual");

  return (
    <div>
      <div className="flex items-center justify-center gap-3">
        <div className="inline-flex rounded-lg border border-border/70 bg-card/70 p-0.5 text-sm">
          {(["monthly", "annual"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterval(value)}
              className={`rounded-md px-3 py-1 font-medium capitalize transition-colors ${
                interval === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {value === "monthly" ? "Aylık" : "Yıllık"}
            </button>
          ))}
        </div>
        {interval === "annual" ? (
          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs">
            2 ay bedava
          </span>
        ) : null}
      </div>

      <div className="mt-8 rounded-2xl border border-border/70 bg-card/70 p-2">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = interval === "monthly" ? plan.monthly : plan.annual;
            return (
              <article
                key={plan.name}
                className={`flex flex-col rounded-xl border p-6 lg:p-8 ${
                  plan.highlighted
                    ? "border-primary/40 bg-card shadow-[0_0_40px_-12px] shadow-primary/20"
                    : "border-border/70 bg-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-sm">{plan.name}</h2>
                  {plan.highlighted ? (
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs">
                      En popüler
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-foreground/60 text-sm">
                  {plan.tagline}
                </p>

                <div className="mt-6 flex items-baseline gap-1.5">
                  <span className="text-4xl font-medium tracking-tight">
                    {price.price}
                  </span>
                  <span className="text-foreground/60 text-sm">
                    {price.suffix}
                  </span>
                </div>
                <p className="mt-1.5 text-foreground/60 text-sm">
                  {price.note}
                </p>

                <ul className="mt-8 flex-1 space-y-3 text-sm">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      />
                      <span className="text-foreground/90">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  className={`mt-8 inline-flex h-10 items-center justify-center rounded-lg border px-4 font-medium text-sm transition-colors ${
                    plan.highlighted
                      ? "border-transparent bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-border bg-transparent hover:bg-accent"
                  }`}
                  href={plan.cta.href}
                >
                  {plan.cta.label}
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
