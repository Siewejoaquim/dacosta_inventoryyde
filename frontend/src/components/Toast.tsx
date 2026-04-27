import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { RiCheckLine, RiCloseLine, RiErrorWarningLine, RiInformationLine } from 'react-icons/ri';

// ── Types ──────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

// ── Context ────────────────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
};

// ── Single Toast Item ──────────────────────────────────────────────────────
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <RiCheckLine size={16} />,
  error:   <RiErrorWarningLine size={16} />,
  warning: <RiErrorWarningLine size={16} />,
  info:    <RiInformationLine size={16} />,
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
    timerRef.current = setTimeout(() => dismiss(), toast.duration ?? 4000);
    return () => clearTimeout(timerRef.current);
  }, []);

  const dismiss = () => {
    setVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`toast toast-${toast.type} ${visible ? 'toast-visible' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon">{ICONS[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={dismiss} aria-label="Dismiss">
        <RiCloseLine size={14} />
      </button>
    </div>
  );
};

// ── Provider ───────────────────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = 'info', duration?: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]);
  }, []);

  const value: ToastContextValue = {
    toast: add,
    success: (m) => add(m, 'success'),
    error:   (m) => add(m, 'error'),
    warning: (m) => add(m, 'warning'),
    info:    (m) => add(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" aria-label="Notifications">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};
