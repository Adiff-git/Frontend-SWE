import iphoneImg from '../../../assets/account/order-item-iphone.png';
import chargerImg from '../../../assets/account/order-item-charger.png';

export const ORDER_FIXTURES = [
  {
    id: 'CT-9821',
    createdAt: '24/10/2026',
    status: 'SHIPPING',
    statusLabel: 'Đang giao hàng',
    paymentText: 'Thanh toán khi nhận hàng (COD) · Chưa thanh toán',
    totalPrice: '30.480.000₫',
    items: [
      {
        id: 'item-1',
        name: 'iPhone 15 Pro Max 256GB Titan Tự nhiên',
        variant: 'Titan Tự nhiên · 256GB · Số lượng: 1',
        price: '29.990.000₫',
        image: iphoneImg,
      },
      {
        id: 'item-2',
        name: 'Củ sạc nhanh Apple 20W Type-C Chính Hãng',
        variant: 'Model: A2305 · Số lượng: 1',
        price: '490.000₫',
        image: chargerImg,
      },
    ],
  },
  {
    id: 'CT-9635',
    createdAt: '12/10/2026',
    deliveredDate: '14/10/2026',
    status: 'DELIVERED',
    statusLabel: 'Đã giao hàng',
    paymentText: 'Đã giao ngày 14/10/2026 · Đã thanh toán',
    totalPrice: '490.000₫',
    items: [
      {
        id: 'item-3',
        name: 'Củ sạc nhanh Apple 20W Type-C Chính Hãng',
        variant: 'Model: A2305 · Số lượng: 1',
        price: '490.000₫',
        image: chargerImg,
      },
    ],
  },
  {
    id: 'CT-9120',
    createdAt: '28/09/2026',
    status: 'CANCELLED',
    statusLabel: 'Đã hủy',
    paymentText: 'Đã hủy đơn hàng · Chưa thanh toán',
    totalPrice: '29.990.000₫',
    items: [
      {
        id: 'item-4',
        name: 'iPhone 15 Pro Max 256GB Titan Tự nhiên',
        variant: 'Titan Tự nhiên · 256GB · Số lượng: 1',
        price: '29.990.000₫',
        image: iphoneImg,
      },
    ],
  },
];

