export default function CartNotice({ message, tone = 'info' }) {
  if (!message) return null;
  return (
    <p className={`cart-notice cart-notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {message}
    </p>
  );
}
