import { isValidQuantity } from './cartValidation.js';

export function buildAddIntent({ variantId, quantity, pathname = '' }) {
  if (!variantId || !isValidQuantity(quantity)) return pathname;
  const params = new URLSearchParams({
    add: '1',
    variant: String(variantId),
    quantity: String(quantity),
  });
  const search = params.toString();
  return `${pathname}${pathname.includes('?') ? '&' : '?'}${search}`;
}

export function readAddIntent(search = '') {
  const params = new URLSearchParams(search);
  if (params.get('add') !== '1') return null;
  const variantId = params.get('variant');
  const quantity = Number(params.get('quantity'));
  if (!variantId || !isValidQuantity(quantity)) return null;
  return { variantId, quantity };
}
