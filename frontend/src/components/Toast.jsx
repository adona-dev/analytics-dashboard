import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export const showToast = (message, type = 'success') => {
  const event = new CustomEvent('toast-notify', { detail: { message, type } });
  window.dispatchEvent(event);
};

const Toast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNotify = (e) => {
      const { message, type } = e.detail;
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };

    window.addEventListener('toast-notify', handleNotify);
    return () => window.removeEventListener('toast-notify', handleNotify);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        
        return (
          <div
            key={toast.id}
            className={`
              flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-scale-in transition-all duration-300
              ${isSuccess 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300' 
                : isError 
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-300' 
                  : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300'
              }
            `}
          >
            {isSuccess && <CheckCircle2 className="shrink-0 w-5 h-5 text-emerald-500" />}
            {isError && <XCircle className="shrink-0 w-5 h-5 text-rose-500" />}
            {!isSuccess && !isError && <AlertTriangle className="shrink-0 w-5 h-5 text-amber-500" />}
            
            <div className="flex-1 text-sm font-medium">
              {toast.message}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
