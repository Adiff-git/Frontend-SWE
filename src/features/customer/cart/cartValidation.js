export function isValidQuantity(value) {
  return Number.isInteger(value) && value >= 1 && value <= 999;
}

export function normalizeQuantity(value) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return isValidQuantity(parsed) ? parsed : null;
}
