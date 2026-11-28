import * as real from './cartApi.real.js';
import * as mock from './cartApi.mock.js';

const impl = import.meta.env.VITE_USE_MOCKS === 'true' ? mock : real;

export const getCart = (...args) => impl.getCart(...args);
export const addCartItem = (...args) => impl.addCartItem(...args);
export const updateCartQuantity = (...args) => impl.updateCartQuantity(...args);
export const changeCartVariant = (...args) => impl.changeCartVariant(...args);
export const selectCartItem = (...args) => impl.selectCartItem(...args);
export const selectAllCartItems = (...args) => impl.selectAllCartItems(...args);
export const removeCartItem = (...args) => impl.removeCartItem(...args);
export const applyCartVoucher = (...args) => impl.applyCartVoucher(...args);
export const removeCartVoucher = (...args) => impl.removeCartVoucher(...args);
export const getVoucherWalletPage = (...args) => impl.getVoucherWalletPage(...args);