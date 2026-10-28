/** Formats an indicative nightly price, or returns '' when none was provided. */
export function formatPrice(amount, currency = 'EUR') {
  if (!Number.isFinite(amount) || amount <= 0) return '';
  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString('en-GB')}`;
  }
}

export function plural(count, one, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}
