/** Formats integer cents for display, e.g. 4400 → "$44". Whole amounts drop the decimals. */
export function formatPrice(cents: number, currency = "USD", locale = "en-US"): string {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}
