import { useEffect, useRef } from 'react';
import xIcon from '../assets/account/x.svg';
import './Dialog.css';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Dialog({
  open,
  title,
  onClose,
  children,
  maxWidth = 520,
  ariaLabel,
  dismissible = true,
}) {
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    dismissibleRef.current = dismissible;
  }, [dismissible]);

  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement;
    const focusableElements = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
    const firstFocusable = focusableElements?.[0];
    firstFocusable?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        if (!dismissibleRef.current) return;
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll(FOCUSABLE_SELECTOR);
        if (!focusables || focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            event.preventDefault();
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = () => {
    if (dismissible) {
      onClose();
    }
  };

  const handleCloseBtnClick = () => {
    if (dismissible) {
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" onClick={handleOverlayClick} role="presentation">
      <div
        className="dialog-card"
        style={{ maxWidth: `${maxWidth}px` }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel || title}
        ref={dialogRef}
      >
        <div className="dialog-card__header">
          {title && <h2 className="dialog-card__title">{title}</h2>}
          <button
            type="button"
            className="dialog-card__close-btn"
            onClick={handleCloseBtnClick}
            disabled={!dismissible}
            aria-label="Đóng hộp thoại"
          >
            <img src={xIcon} alt="" width="20" height="20" />
          </button>
        </div>
        <div className="dialog-card__body">{children}</div>
      </div>
    </div>
  );
}
