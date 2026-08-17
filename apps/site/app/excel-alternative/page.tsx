import type { Metadata } from "next";
import { ComparisonPage } from "@/components/landing/comparison-page";
import { comparisons } from "@/lib/comparisons";

export const metadata: Metadata = {
  title: "Excel ve e-posta yerine tek bir proje sistemi",
  description:
    "Malzeme listesini Excel'de, onayları e-postada, soruları WhatsApp'ta tutmak yerine; Lumia.PM ile mimarlık projelerinizi tek bir denetlenebilir sistemde yönetin.",
  alternates: { canonical: "/excel-alternative" },
};

export default function Page() {
  return <ComparisonPage data={comparisons.excel} />;
}
