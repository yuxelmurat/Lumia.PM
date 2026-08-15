import { createHmac } from "node:crypto";
import { HTTPException } from "hono/http-exception";
import {
  paytrCurrency,
  paytrMerchantId,
  paytrMerchantKey,
  paytrMerchantSalt,
  paytrTestMode,
} from "./config";

const DIRECT_API_URL = "https://www.paytr.com/odeme";
const CALLBACK_HASH_SEPARATOR = ""; // fields are concatenated with no separator, per PayTR's docs

function hmacBase64(payload: string, key: string) {
  return createHmac("sha256", key).update(payload, "utf8").digest("base64");
}

/**
 * Hash for the Direct API "payment from stored card" / "add card" POST to
 * https://www.paytr.com/odeme. Formula verified against PayTR's Direct API
 * docs (dev.paytr.com/en/direkt-api/kart-saklama-api/*):
 *   base64(hmac_sha256(
 *     merchant_id + user_ip + merchant_oid + email + payment_amount +
 *       payment_type + installment_count + currency + test_mode + non_3d +
 *       merchant_salt,
 *     merchant_key,
 *   ))
 */
function buildDirectApiToken(fields: {
  userIp: string;
  merchantOid: string;
  email: string;
  paymentAmount: number;
  paymentType: "card";
  installmentCount: number;
  currency: string;
  testMode: 0 | 1;
  non3d: 0 | 1;
}) {
  const payload =
    paytrMerchantId() +
    fields.userIp +
    fields.merchantOid +
    fields.email +
    String(fields.paymentAmount) +
    fields.paymentType +
    String(fields.installmentCount) +
    fields.currency +
    String(fields.testMode) +
    String(fields.non3d) +
    paytrMerchantSalt();
  return hmacBase64(payload, paytrMerchantKey());
}

function userBasket(description: string, amountKurus: number) {
  const basket = [[description, (amountKurus / 100).toFixed(2), 1]];
  return Buffer.from(JSON.stringify(basket)).toString("base64");
}

/**
 * Builds the field set for a browser-submitted `<form action="https://www.paytr.com/odeme">`
 * that captures a card, charges it, and (via store_card=1) has PayTR return a
 * reusable `utoken`/`ctoken` on the bildirim callback for later stored-card
 * renewal charges. PayTR's iFrame get-token API does NOT support store_card
 * (verified against dev.paytr.com/iframe-api/iframe-api-1-adim) — card
 * storage is exclusively a Direct API capability, so this form must post the
 * card fields (entered by the customer) straight to PayTR's own domain. Our
 * server never receives the card number/CVV; it only computes and signs the
 * non-card fields below.
 */
export function buildCardStorageCheckoutForm(input: {
  merchantOid: string;
  userIp: string;
  email: string;
  amountKurus: number;
  description: string;
  okUrl: string;
  failUrl: string;
  storeCard: boolean;
  utoken?: string | null;
}) {
  const testMode: 0 | 1 = paytrTestMode() ? 1 : 0;
  const currency = paytrCurrency();
  const paymentType = "card" as const;
  const installmentCount = 0;
  const non3d: 0 | 1 = 0; // first charge keeps 3D Secure; fraud liability protection while a card is new

  const paytrToken = buildDirectApiToken({
    userIp: input.userIp,
    merchantOid: input.merchantOid,
    email: input.email,
    paymentAmount: input.amountKurus,
    paymentType,
    installmentCount,
    currency,
    testMode,
    non3d,
  });

  const fields: Record<string, string> = {
    merchant_id: paytrMerchantId(),
    user_ip: input.userIp,
    merchant_oid: input.merchantOid,
    email: input.email,
    payment_type: paymentType,
    payment_amount: String(input.amountKurus),
    installment_count: String(installmentCount),
    currency,
    test_mode: String(testMode),
    non_3d: String(non3d),
    merchant_ok_url: input.okUrl,
    merchant_fail_url: input.failUrl,
    user_basket: userBasket(input.description, input.amountKurus),
    paytr_token: paytrToken,
  };

  if (input.storeCard) {
    fields.store_card = "1";
  }
  if (input.utoken) {
    fields.utoken = input.utoken;
  }

  return { actionUrl: DIRECT_API_URL, fields };
}

/**
 * Server-initiated charge against a previously stored card (Direct API,
 * "kayıtlı karttan ödeme"). Used by the renewal scheduler and seat top-ups.
 * non_3d=1: 3D Secure is skipped for these unattended charges, which
 * requires PayTR to have granted the merchant account "Non3D" permission —
 * see the report for this flag.
 *
 * PayTR's synchronous response shape for non-3D Direct API charges isn't
 * fully documented; billing state changes are NOT applied from this
 * response. This call only reports whether the HTTP request itself
 * succeeded or was synchronously rejected — the bildirim callback remains
 * the sole source of truth for activating/renewing a subscription, exactly
 * like the checkout flow.
 */
export async function chargeStoredCard(input: {
  merchantOid: string;
  userIp: string;
  email: string;
  amountKurus: number;
  utoken: string;
  ctoken?: string | null;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const testMode: 0 | 1 = paytrTestMode() ? 1 : 0;
  const currency = paytrCurrency();
  const paymentType = "card" as const;
  const installmentCount = 0;
  const non3d: 0 | 1 = 1;

  const paytrToken = buildDirectApiToken({
    userIp: input.userIp,
    merchantOid: input.merchantOid,
    email: input.email,
    paymentAmount: input.amountKurus,
    paymentType,
    installmentCount,
    currency,
    testMode,
    non3d,
  });

  const body = new URLSearchParams({
    merchant_id: paytrMerchantId(),
    user_ip: input.userIp,
    merchant_oid: input.merchantOid,
    email: input.email,
    payment_type: paymentType,
    payment_amount: String(input.amountKurus),
    installment_count: String(installmentCount),
    currency,
    test_mode: String(testMode),
    non_3d: String(non3d),
    utoken: input.utoken,
    paytr_token: paytrToken,
  });
  if (input.ctoken) {
    body.set("ctoken", input.ctoken);
  }

  try {
    const response = await fetch(DIRECT_API_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      return { ok: false, reason: `http_${response.status}` };
    }

    const text = await response.text();
    let parsed: { status?: string; err_msg?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // Non-JSON bodies are treated as "request accepted"; the bildirim
      // callback is authoritative regardless.
      return { ok: true };
    }

    if (parsed.status === "failed") {
      return { ok: false, reason: parsed.err_msg ?? "declined" };
    }
    return { ok: true };
  } catch (error) {
    console.error("PayTR stored-card charge request failed:", error);
    throw new HTTPException(502, {
      message: "Billing provider request failed",
    });
  }
}

/**
 * Verifies a bildirim (notification) callback's hash. Formula per PayTR's
 * documented callback verification:
 *   base64(hmac_sha256(merchant_oid + merchant_salt + status + total_amount, merchant_key))
 */
export function verifyCallbackHash(fields: {
  merchantOid: string;
  status: string;
  totalAmount: string;
  hash: string;
}) {
  const payload =
    fields.merchantOid +
    paytrMerchantSalt() +
    fields.status +
    fields.totalAmount +
    CALLBACK_HASH_SEPARATOR;
  const expected = hmacBase64(payload, paytrMerchantKey());
  return timingSafeEqualString(expected, fields.hash);
}

function timingSafeEqualString(a: string, b: string) {
  if (a.length !== b.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
