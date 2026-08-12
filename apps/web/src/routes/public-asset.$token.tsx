import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import GuestIdentityForm from "@/components/asset-pin/guest-identity-form";
import type { AssetPin } from "@/components/asset-pin/pin-overlay";
import PublicApprovalPanel from "@/components/asset-pin/public-approval-panel";
import PublicAssetPinViewer from "@/components/asset-pin/public-asset-pin-viewer";
import PublicDwgPinViewer from "@/components/asset-pin/public-dwg-pin-viewer";
import PageTitle from "@/components/page-title";
import { KaneoBranding } from "@/components/public-project/kaneo-branding";
import { ThemeToggle } from "@/components/public-project/theme-toggle";
import useCreatePublicAssetGuest from "@/hooks/mutations/public-asset/use-create-public-asset-guest";
import useGetPublicAsset from "@/hooks/queries/public-asset/use-get-public-asset";

export const Route = createFileRoute("/public-asset/$token")({
  component: RouteComponent,
});

function guestStorageKey(token: string) {
  return `kaneo-asset-guest-${token}`;
}

function RouteComponent() {
  const { t } = useTranslation();
  const { token } = Route.useParams();
  const { data, isLoading, error } = useGetPublicAsset(token);
  const { mutateAsync: createGuest, isPending: isCreatingGuest } =
    useCreatePublicAssetGuest();

  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    setGuestId(localStorage.getItem(guestStorageKey(token)));
  }, [token]);

  const handleGuestSubmit = async ({
    name,
    email,
  }: {
    name: string;
    email: string;
  }) => {
    const result = await createGuest({ token, name, email });
    if (result.guestId) {
      localStorage.setItem(guestStorageKey(token), result.guestId);
      setGuestId(result.guestId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <span className="text-muted-foreground text-sm">
          {t("assetPins:loading", "Loading…")}
        </span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
        <p className="text-muted-foreground text-sm">
          {t(
            "assetPins:linkInvalid",
            "This link is invalid, expired, or has been revoked.",
          )}
        </p>
      </div>
    );
  }

  if (!guestId) {
    return (
      <GuestIdentityForm
        isSubmitting={isCreatingGuest}
        onSubmit={handleGuestSubmit}
      />
    );
  }

  return (
    <>
      <PageTitle title={data.asset.filename} />
      <div className="flex min-h-screen w-full flex-col bg-background">
        <header className="sticky top-0 z-10 border-border border-b bg-background">
          <div className="flex items-center justify-between gap-4 px-6 py-2.5">
            <h1 className="truncate font-semibold text-lg">
              {data.asset.filename}
            </h1>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 flex flex-col gap-3 p-6">
          <PublicApprovalPanel
            token={token}
            guestId={guestId}
            approvalStatus={data.asset.approvalStatus}
          />
          {data.asset.kind === "dwg" ? (
            <PublicDwgPinViewer
              token={token}
              guestId={guestId}
              pins={data.pins as AssetPin[]}
            />
          ) : (
            <PublicAssetPinViewer
              token={token}
              guestId={guestId}
              imageUrl={data.asset.url}
              alt={data.asset.filename}
              pins={data.pins as AssetPin[]}
            />
          )}
        </main>
        <footer className="border-border border-t">
          <div className="px-6 py-3">
            <KaneoBranding />
          </div>
        </footer>
      </div>
    </>
  );
}
