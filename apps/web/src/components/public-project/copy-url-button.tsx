import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { toast } from "@/lib/toast";

export function CopyUrlButton() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(t("publicProject:copyUrl.successToast"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
      toast.error(t("publicProject:copyUrl.errorToast"));
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopyUrl}
      className="h-8 gap-2"
    >
      <span className="relative inline-flex h-3 w-3 items-center justify-center">
        <Check
          className={cn(
            "absolute h-3 w-3 transition-opacity duration-150",
            copied ? "opacity-100" : "opacity-0",
          )}
        />
        <Copy
          className={cn(
            "absolute h-3 w-3 transition-opacity duration-150",
            copied ? "opacity-0" : "opacity-100",
          )}
        />
      </span>
      <span className="text-xs">
        {copied
          ? t("publicProject:copyUrl.copied")
          : t("publicProject:copyUrl.share")}
      </span>
    </Button>
  );
}
