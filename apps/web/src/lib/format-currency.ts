export function formatCurrencyFromCents(cents: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
  });
}
