import { createFileRoute } from "@tanstack/react-router";
import { Check, Sparkles, TriangleAlert } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import { z } from "zod";
import PageTitle from "@/components/page-title";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import {
  submitDirectApiForm,
  useCancelSubscription,
  useCreateCheckout,
} from "@/hooks/mutations/billing/use-billing-actions";
import { useGetBilling } from "@/hooks/queries/billing/use-get-billing";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { cn } from "@/lib/cn";

const searchSchema = z.object({
  openPlan: z.enum(["personal", "team"]).optional(),
  openInterval: z.enum(["monthly", "annual"]).optional(),
});

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/settings/workspace/billing",
)({
  component: RouteComponent,
  validateSearch: searchSchema,
});

type Interval = "monthly" | "annual";
type PlanKey = "personal" | "team";

const PLANS: {
  plan: PlanKey;
  name: string;
  tagline: string;
  monthly: { price: string; suffix: string; note: string };
  annual: { price: string; suffix: string; note: string };
  features: string[];
  highlighted?: boolean;
}[] = [
  {
    plan: "personal",
    name: "Personal",
    tagline: "For individuals",
    monthly: { price: "$4", suffix: "/ month", note: "Billed monthly" },
    annual: {
      price: "$40",
      suffix: "/ year",
      note: "$3.33 / month, billed yearly",
    },
    features: [
      "Single user",
      "Unlimited projects and tasks",
      "Automatic backups and updates",
      "Email support",
    ],
  },
  {
    plan: "team",
    name: "Team",
    tagline: "For teams working together",
    monthly: { price: "$5", suffix: "/ user / month", note: "Billed monthly" },
    annual: {
      price: "$50",
      suffix: "/ user / year",
      note: "$4.17 / user / month, billed yearly",
    },
    features: [
      "Unlimited team members",
      "Unlimited projects and tasks",
      "Workspace roles and permissions",
      "Automatic backups and updates",
      "Priority email support",
    ],
    highlighted: true,
  },
];

const STATUS: Record<
  string,
  { label: string; variant: "success" | "warning" | "error" | "secondary" }
> = {
  active: { label: "Active", variant: "success" },
  trialing: { label: "Trial", variant: "success" },
  past_due: { label: "Payment past due", variant: "warning" },
  scheduled_cancel: { label: "Cancels soon", variant: "warning" },
  canceled: { label: "Canceled", variant: "error" },
  expired: { label: "Expired", variant: "error" },
  paused: { label: "Paused", variant: "secondary" },
};

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function daysUntil(value: string | null | undefined) {
  if (!value) return null;
  const ms = new Date(value).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="font-medium text-md">{title}</h2>
      <p className="text-muted-foreground text-xs">{subtitle}</p>
    </div>
  );
}

/**
 * Collects the card PayTR will store for auto-renewal. The card fields are
 * merged into the signed field set our server returned and the whole form
 * is POSTed straight to PayTR's domain — this dialog's <form> never sends
 * card data through our own backend.
 */
function CardCheckoutDialog({
  open,
  onOpenChange,
  planName,
  workspaceId,
  plan,
  interval,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  workspaceId: string | undefined;
  plan: PlanKey;
  interval: Interval;
}) {
  const checkout = useCreateCheckout(workspaceId);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvv, setCvv] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const { actionUrl, fields } = await checkout.mutateAsync({
      plan,
      interval,
    });
    submitDirectApiForm(actionUrl, {
      ...fields,
      cc_owner: cardName,
      card_number: cardNumber.replace(/\s+/g, ""),
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      cvv,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Subscribe to {planName}</DialogTitle>
            <DialogDescription>
              Payments are securely processed by PayTR. Your card is saved for
              automatic renewal; cancel anytime from this page.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cc_owner">Name on card</Label>
              <Input
                id="cc_owner"
                required
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="card_number">Card number</Label>
              <Input
                id="card_number"
                required
                inputMode="numeric"
                autoComplete="cc-number"
                maxLength={19}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="expiry_month">Month</Label>
                <Input
                  id="expiry_month"
                  required
                  placeholder="MM"
                  inputMode="numeric"
                  maxLength={2}
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="expiry_year">Year</Label>
                <Input
                  id="expiry_year"
                  required
                  placeholder="YY"
                  inputMode="numeric"
                  maxLength={2}
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  required
                  inputMode="numeric"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={checkout.isPending}>
              {checkout.isPending ? "Preparing…" : "Subscribe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RouteComponent() {
  const { workspace, isAdmin } = useWorkspacePermission();
  const workspaceId = workspace?.id;
  const canManage = isAdmin;
  const search = Route.useSearch();

  const { data: billing, isLoading } = useGetBilling(workspaceId);
  const cancelSubscription = useCancelSubscription(workspaceId);
  const [interval, setInterval] = useState<Interval>(
    search.openInterval ?? "annual",
  );
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey | null>(
    search.openPlan ?? null,
  );

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!billing?.billingEnabled) {
    return (
      <>
        <PageTitle title="Billing" />
        <div className="mx-auto max-w-4xl space-y-2">
          <h1 className="font-semibold text-2xl">Billing</h1>
          <p className="text-muted-foreground text-sm">
            Billing isn't enabled on this instance. Self-hosted Lumia.PM
            includes every feature, free forever.
          </p>
        </div>
      </>
    );
  }

  const hasSubscription = Boolean(billing.plan && billing.status);
  const status = billing.status ? STATUS[billing.status] : null;
  const renews = formatDate(billing.currentPeriodEnd);
  const trialDaysLeft = daysUntil(billing.trialEndsAt);
  const trialExpired =
    !billing.foundingFree && !hasSubscription && trialDaysLeft === 0;

  const pricePer = billing.billingInterval === "annual" ? "year" : "month";
  const planLabel =
    billing.plan === "team"
      ? "Team"
      : billing.plan === "personal"
        ? "Personal"
        : null;

  return (
    <>
      <PageTitle title="Billing" />
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl">Billing</h1>
          <p className="text-muted-foreground">
            Manage the Lumia.PM Cloud subscription for this workspace.
          </p>
        </div>

        {/* ── Current plan ── */}
        <div className="space-y-6">
          <SectionHeader
            title="Current plan"
            subtitle="Your workspace's active plan and billing status."
          />

          {billing.foundingFree ? (
            <div className="overflow-hidden rounded-md border border-primary/30 bg-sidebar">
              <div className="flex items-start gap-3 p-5">
                <div className="mt-0.5 flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="size-4.5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">Founding Free</h3>
                    <Badge variant="success" size="sm">
                      Free
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    This workspace has free access to Lumia.PM Cloud as an early
                    supporter. Thank you for being here from the start.
                  </p>
                </div>
              </div>
            </div>
          ) : hasSubscription ? (
            <div className="rounded-md border border-border bg-sidebar">
              <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-sm">
                      Lumia.PM Cloud {planLabel}
                    </h3>
                    {status ? (
                      <Badge variant={status.variant} size="sm">
                        {status.label}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {billing.plan === "team"
                      ? `$${billing.billingInterval === "annual" ? 50 : 5} / user / ${pricePer}`
                      : `$${billing.billingInterval === "annual" ? 40 : 4} / ${pricePer}`}
                    {billing.seats > 1 ? ` · ${billing.seats} seats` : null}
                  </p>
                </div>
                <div className="text-right">
                  {renews ? (
                    <p className="text-muted-foreground text-xs">
                      {billing.canceledAt ? "Access ends" : "Renews"}
                    </p>
                  ) : null}
                  {renews ? (
                    <p className="font-medium text-sm">{renews}</p>
                  ) : null}
                </div>
              </div>
              <Separator />
              <div className="flex flex-col items-start gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-muted-foreground text-xs">
                  {billing.canceledAt
                    ? "This subscription is canceled and won't renew."
                    : "Cancel anytime; access continues until the end of the billing period."}
                </p>
                {!billing.canceledAt ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canManage || cancelSubscription.isPending}
                    onClick={() => cancelSubscription.mutate()}
                  >
                    {cancelSubscription.isPending
                      ? "Canceling…"
                      : "Cancel subscription"}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "rounded-md border bg-sidebar p-5",
                trialExpired ? "border-warning/40" : "border-border",
              )}
            >
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex size-9 items-center justify-center rounded-md",
                    trialExpired
                      ? "bg-warning/10 text-warning-foreground"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {trialExpired ? (
                    <TriangleAlert className="size-4.5" />
                  ) : (
                    <Sparkles className="size-4.5" />
                  )}
                </div>
                <div className="space-y-1">
                  <h3 className="font-medium text-sm">
                    {trialExpired ? "Your trial has ended" : "Free trial"}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {trialExpired
                      ? "Subscribe to a plan below to keep creating and editing. Your data stays safe and exportable in the meantime."
                      : trialDaysLeft !== null
                        ? `You have ${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left on your free trial. Choose a plan to continue without interruption.`
                        : "Choose a plan below to continue after your trial."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Plan picker ── */}
        {!billing.foundingFree && !hasSubscription ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <SectionHeader
                title="Choose a plan"
                subtitle="Switch anytime. Cancel whenever you like."
              />
              <div className="inline-flex items-center gap-2">
                <div className="inline-flex rounded-md border border-border bg-sidebar p-0.5 text-xs">
                  {(["monthly", "annual"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setInterval(value)}
                      className={cn(
                        "rounded-[0.3rem] px-3 py-1 font-medium capitalize transition-colors",
                        interval === value
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                {interval === "annual" ? (
                  <Badge variant="success" size="sm">
                    2 months free
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {PLANS.map((p) => {
                  const price = interval === "monthly" ? p.monthly : p.annual;
                  return (
                    <div
                      key={p.plan}
                      className={cn(
                        "flex flex-col rounded-xl border p-6",
                        p.highlighted
                          ? "border-primary/40 bg-card shadow-[0_0_40px_-12px] shadow-primary/20"
                          : "border-border/70 bg-card",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm">{p.name}</h3>
                        {p.highlighted ? (
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-medium text-primary text-xs">
                            Most popular
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-foreground/60 text-sm">
                        {p.tagline}
                      </p>

                      <div className="mt-6 flex items-baseline gap-1.5">
                        <span className="font-medium text-4xl tracking-tight">
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
                        {p.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2.5"
                          >
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <span className="text-foreground/90">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>

                      <Button
                        variant={p.highlighted ? "default" : "outline"}
                        className="mt-8 w-full"
                        disabled={!canManage}
                        onClick={() => setCheckoutPlan(p.plan)}
                      >
                        {`Choose ${p.name}`}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-muted-foreground text-xs">
              {canManage
                ? "Payments are securely processed by PayTR. Prices exclude tax where applicable."
                : "Only workspace owners and admins can manage billing."}
            </p>
          </div>
        ) : null}
      </div>
      {checkoutPlan ? (
        <CardCheckoutDialog
          open={Boolean(checkoutPlan)}
          onOpenChange={(next) => {
            if (!next) setCheckoutPlan(null);
          }}
          planName={
            PLANS.find((p) => p.plan === checkoutPlan)?.name ?? checkoutPlan
          }
          workspaceId={workspaceId}
          plan={checkoutPlan}
          interval={interval}
        />
      ) : null}
    </>
  );
}
