import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

/** Accessible overlay base: Esc to close, focus trap, focus restore, scrim click. */
export default function Dialog({ title, subtitle, onClose, variant = 'modal', children }) {
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const node = ref.current;
    node?.querySelector('[data-autofocus]')?.focus() ?? node?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previous?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className={`overlay overlay--${variant}`}>
      <div className="overlay__scrim" onClick={onClose} aria-hidden="true" />
      <div ref={ref} className="overlay__panel" role="dialog" aria-modal="true" aria-labelledby="dialog-title" tabIndex={-1}>
        <header className="overlay__head">
          <div>
            <h2 id="dialog-title">{title}</h2>
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close" data-autofocus>
            <X size={18} />
          </button>
        </header>
        <div className="overlay__body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
