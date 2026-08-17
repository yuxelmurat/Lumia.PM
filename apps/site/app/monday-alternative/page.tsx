import type { Metadata } from "next";
import { ComparisonPage } from "@/components/landing/comparison-page";
import { comparisons } from "@/lib/comparisons";

export const metadata: Metadata = {
  title: "Mimarlık ofisleri için Monday.com alternatifi",
  description:
    "Lumia.PM; RFI, submittal, değişiklik emri ve ruhsat takibi gibi mimarlık ofislerine özgü iş akışlarını hazır getiren proje yönetim platformu. Monday.com ile karşılaştırın.",
  alternates: { canonical: "/monday-alternative" },
};

export default function Page() {
  return <ComparisonPage data={comparisons.monday} />;
}
