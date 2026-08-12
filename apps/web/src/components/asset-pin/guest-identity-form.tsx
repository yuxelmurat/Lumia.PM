import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";

type GuestIdentityFormProps = {
  isSubmitting: boolean;
  onSubmit: (identity: { name: string; email: string }) => Promise<void>;
};

export default function GuestIdentityForm({
  isSubmitting,
  onSubmit,
}: GuestIdentityFormProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error(
        t("assetPins:guest.missingFields", "Please enter your name and email"),
      );
      return;
    }
    await onSubmit({ name: name.trim(), email: email.trim() });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border/60 bg-card/70 p-6"
      >
        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-lg">
            {t("assetPins:guest.title", "Leave feedback on this render")}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t(
              "assetPins:guest.description",
              "Enter your name and email so the team knows who left the note. No account needed.",
            )}
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="guest-name">
            {t("assetPins:guest.name", "Name")}
          </Label>
          <Input
            id="guest-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="guest-email">
            {t("assetPins:guest.email", "Email")}
          </Label>
          <Input
            id="guest-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {t("assetPins:guest.continue", "Continue")}
        </Button>
      </form>
    </div>
  );
}
