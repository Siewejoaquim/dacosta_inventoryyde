import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { RiErrorWarningLine } from 'react-icons/ri';

// ── Types ──────────────────────────────────────────────────────────────────
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return ctx;
};

// ── Provider ───────────────────────────────────────────────────────────────
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({ message: '' });
  const resolveRef = useRef<(value: boolean) => void>();

  const confirm: ConfirmFn = useCallback((options) => {
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setOpen(false);
    resolveRef.current?.(false);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {open && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-icon-wrap" style={{ color: opts.danger ? 'var(--danger)' : 'var(--warning)' }}>
              <RiErrorWarningLine size={28} />
            </div>
            <h3 className="modal-title">{opts.title ?? 'Are you sure?'}</h3>
            <p className="modal-message">{opts.message}</p>
            <div className="modal-actions">
              <button className="btn secondary" onClick={handleCancel}>Cancel</button>
              <button
                className={`btn ${opts.danger ? 'danger' : 'accent'}`}
                onClick={handleConfirm}
              >
                {opts.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};
