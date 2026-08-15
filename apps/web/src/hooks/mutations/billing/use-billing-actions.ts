import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  type BillingInterval,
  type BillingPlan,
  cancelBillingSubscription,
  createBillingCheckout,
} from "@/fetchers/billing/create-checkout";

/**
 * PayTR's card-storage checkout is a Direct API POST, not a redirect URL:
 * the card fields the customer types must go straight to PayTR's own
 * domain, so we build and submit a real HTML form instead of `fetch`. Our
 * server only ever sees the non-card fields it already signed; the caller
 * merges in the customer-entered card fields (see the checkout dialog)
 * before calling this.
 */
export function submitDirectApiForm(
  actionUrl: string,
  fields: Record<string, string>,
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = actionUrl;
  form.style.display = "none";
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

/** Fetches the signed, non-card checkout fields. Does not submit anything —
 * the caller combines these with customer-entered card fields first. */
export function useCreateCheckout(workspaceId: string | undefined) {
  return useMutation({
    mutationFn: (input: { plan: BillingPlan; interval: BillingInterval }) =>
      createBillingCheckout({ workspaceId: workspaceId as string, ...input }),
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not start checkout",
      );
    },
  });
}

export function useCancelSubscription(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelBillingSubscription(workspaceId as string),
    onSuccess: () => {
      toast.success(
        "Subscription canceled. Access continues until the end of the billing period.",
      );
      queryClient.invalidateQueries({ queryKey: ["billing", workspaceId] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not cancel subscription",
      );
    },
  });
}
