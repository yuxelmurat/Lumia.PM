import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useGetBilling } from "@/hooks/queries/billing/use-get-billing";
import useGetConfig from "@/hooks/queries/config/use-get-config";
import useActiveWorkspace from "@/hooks/queries/workspace/use-active-workspace";
import { useWorkspacePermission } from "@/hooks/use-workspace-permission";
import { clearCheckoutIntent, readCheckoutIntent } from "@/lib/checkout-intent";

/**
 * Completes a pricing-page deep link: once a new user lands in a workspace,
 * if they arrived via `?checkout=<plan>-<interval>` and the workspace can be
 * billed, send them to the billing page with the plan preselected so it can
 * open the checkout card dialog. Unlike Creem's hosted checkout, PayTR's
 * card-storage flow needs the customer to actually type a card, so this
 * can no longer redirect straight into checkout on its own. No-ops (and
 * clears the intent) when it doesn't apply.
 */
export function usePendingCheckout() {
  const { data: workspace } = useActiveWorkspace();
  const { data: config } = useGetConfig();
  const { data: billing } = useGetBilling(workspace?.id);
  const { isAdmin, isCheckingPermissions } = useWorkspacePermission();
  const navigate = useNavigate();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    if (!readCheckoutIntent()) return;

    // Wait until everything needed to decide has loaded.
    if (!config || !workspace?.id || !billing || isCheckingPermissions) return;

    handled.current = true;

    const intent = readCheckoutIntent();
    clearCheckoutIntent();

    const alreadyBilled =
      billing.foundingFree || Boolean(billing.plan && billing.status);
    if (!intent || !config.billingEnabled || alreadyBilled || !isAdmin) {
      return;
    }

    navigate({
      to: "/dashboard/settings/workspace/billing",
      search: { openPlan: intent.plan, openInterval: intent.interval },
    });
  }, [
    config,
    workspace?.id,
    billing,
    isAdmin,
    isCheckingPermissions,
    navigate,
  ]);
}
