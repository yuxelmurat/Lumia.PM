import { useTranslation } from "react-i18next";

export function ProductBranding() {
  const { t } = useTranslation();

  return (
    <span>
      {t("publicProject:branding.poweredBy")}{" "}
      <span className="font-medium">{t("common:appName")}</span>
    </span>
  );
}
