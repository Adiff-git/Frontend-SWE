export function parseExactMoneyJson(text) {
  if (typeof text !== 'string') {
    throw new Error('Phản hồi tiền tệ phải là văn bản JSON.');
  }

  const quoted = text.replace(/"amount"\s*:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g, '"amount":"$1"');
  let parsed;
  try {
    parsed = JSON.parse(quoted);
  } catch {
    throw new Error('Phản hồi tiền tệ không phải JSON hợp lệ.');
  }
  assertExactAmounts(parsed);
  return parsed;
}

function assertExactAmounts(value, path = 'root') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertExactAmounts(entry, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  Object.entries(value).forEach(([key, entry]) => {
    if (key === 'amount' && (typeof entry !== 'string' || !/^-?\d+$/.test(entry))) {
      throw new Error(`Giá tiền không phải số nguyên tại ${path}.${key}`);
    }
    assertExactAmounts(entry, `${path}.${key}`);
  });
}

export function formatExactVnd(amount) {
  if (amount === null || amount === undefined || amount === '') return '—';
  const digits = String(amount);
  if (!/^-?\d+$/.test(digits)) return '—';
  return `${new Intl.NumberFormat('vi-VN').format(BigInt(digits))}₫`;
}
