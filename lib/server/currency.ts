/**
 * Currency resolution for the practice-candidate app.
 *
 * Mirrors the landing and recruiter resolvers so all three surfaces agree on
 * which country maps to which currency. Separate file because the apps have
 * separate dependency trees.
 */

export const SUPPORTED_CURRENCIES = ["INR", "USD", "GBP", "EUR"] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

export const FALLBACK_CURRENCY: CurrencyCode = "USD";

const EUROZONE_COUNTRIES = new Set([
  "AT", "BE", "HR", "CY", "EE", "FI", "FR", "DE", "GR", "IE",
  "IT", "LV", "LT", "LU", "MT", "NL", "PT", "SK", "SI", "ES",
]);

const GBP_COUNTRIES = new Set(["GB", "UK"]);

export function resolveCurrencyFromCountry(country: string | null | undefined): CurrencyCode {
  const normalized = (country ?? "").trim().toUpperCase();

  if (normalized === "IN") return "INR";
  if (GBP_COUNTRIES.has(normalized)) return "GBP";
  if (EUROZONE_COUNTRIES.has(normalized)) return "EUR";
  if (normalized === "US") return "USD";

  return FALLBACK_CURRENCY;
}

export function normalizeCurrency(value: unknown): CurrencyCode | null {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toUpperCase();

  return (SUPPORTED_CURRENCIES as readonly string[]).includes(normalized)
    ? (normalized as CurrencyCode)
    : null;
}
