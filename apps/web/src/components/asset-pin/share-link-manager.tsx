import { Check, Copy, Link2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import useCreateAssetShareLink from "@/hooks/mutations/asset-share/use-create-asset-share-link";
import useRevokeAssetShareLink from "@/hooks/mutations/asset-share/use-revoke-asset-share-link";
import useGetAssetShareLinks from "@/hooks/queries/asset-share/use-get-asset-share-links";
import { toast } from "@/lib/toast";

type AssetShareLink = {
  id: string;
  token: string;
  revokedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

function shareUrlFor(token: string) {
  return `${window.location.origin}/public-asset/${token}`;
}

function CopyLinkButton({ token }: { token: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrlFor(token));
      setCopied(true);
      toast.success(t("assetPins:shareLink.copied", "Link copied"));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy share link:", error);
      toast.error(t("assetPins:shareLink.copyFailed", "Failed to copy link"));
    }
  };

  return (
    <Button size="xs" variant="ghost" onClick={handleCopy} className="gap-1.5">
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      <span className="text-xs">
        {copied
          ? t("assetPins:shareLink.copied", "Copied")
          : t("assetPins:shareLink.copy", "Copy")}
      </span>
    </Button>
  );
}

type ShareLinkManagerProps = {
  assetId: string;
};

export default function ShareLinkManager({ assetId }: ShareLinkManagerProps) {
  const { t } = useTranslation();
  const { data: links = [] } = useGetAssetShareLinks(assetId);
  const { mutateAsync: createShareLink, isPending: isCreating } =
    useCreateAssetShareLink(assetId);
  const { mutateAsync: revokeShareLink } = useRevokeAssetShareLink(assetId);

  const activeLinks = (links as AssetShareLink[]).filter(
    (link) => !link.revokedAt,
  );

  const handleCreate = async () => {
    try {
      await createShareLink({ assetId });
      toast.success(t("assetPins:shareLink.created", "Share link created"));
    } catch (error) {
      console.error("Failed to create asset share link:", error);
      toast.error(
        t("assetPins:shareLink.createFailed", "Failed to create link"),
      );
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await revokeShareLink({ id });
    } catch (error) {
      console.error("Failed to revoke asset share link:", error);
      toast.error(
        t("assetPins:shareLink.revokeFailed", "Failed to revoke link"),
      );
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card/70 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">
          {t("assetPins:shareLink.title", "Share with client")}
        </span>
        <Button
          size="xs"
          variant="outline"
          disabled={isCreating}
          onClick={handleCreate}
          className="gap-1.5"
        >
          <Link2 className="size-3.5" />
          {t("assetPins:shareLink.create", "New link")}
        </Button>
      </div>
      {activeLinks.length === 0 ? (
        <p className="text-muted-foreground text-xs">
          {t(
            "assetPins:shareLink.empty",
            "No active links. Create one to let a client view and annotate this file without an account.",
          )}
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {activeLinks.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2 py-1.5"
            >
              <span className="truncate text-muted-foreground text-xs">
                {shareUrlFor(link.token)}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                <CopyLinkButton token={link.token} />
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleRevoke(link.id)}
                  className="text-destructive"
                  aria-label={t("assetPins:shareLink.revoke", "Revoke")}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
