export function formatCurrencyTZS(amount: number) {
  return new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(d: Date) {
  return d.toLocaleString("en-TZ", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
