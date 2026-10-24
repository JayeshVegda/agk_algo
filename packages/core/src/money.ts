export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

/**
 * Creates a Money value object.
 * Amount must be an integer minor unit (e.g. cents, satoshis).
 */
export function createMoney(amountMinor: number, currency = "USD"): Money {
  if (!Number.isInteger(amountMinor)) {
    throw new TypeError(`Amount in minor units must be an integer, received: ${amountMinor}`);
  }
  return {
    amountMinor,
    currency: currency.toUpperCase(),
  };
}

/**
 * Formats minor units to display string (e.g. 1000 minor USD -> "$10.00").
 */
export function formatMoney(money: Money): string {
  const major = (money.amountMinor / 100).toFixed(2);
  if (money.currency === "USD") {
    return `$${major}`;
  }
  return `${major} ${money.currency}`;
}
