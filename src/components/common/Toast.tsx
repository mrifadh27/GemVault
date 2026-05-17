'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />,
    error: <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />,
    info: <Info className="w-4 h-4 text-gold flex-shrink-0" />,
  };

  return (
    <div className={cn(
      'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm',
      'bg-[#141414] border-[#2a2a2a] shadow-xl animate-slide-up',
      'max-w-sm w-full'
    )}>
      {icons[toast.type]}
      <span className="flex-1 text-ivory">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="text-ivory-subtle hover:text-ivory">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Global toast state
let toastListeners: Array<(toasts: ToastData[]) => void> = [];
let toasts: ToastData[] = [];

function updateToasts(newToasts: ToastData[]) {
  toasts = newToasts;
  toastListeners.forEach(l => l(toasts));
}

export function toast(message: string, type: ToastData['type'] = 'info') {
  const id = Math.random().toString(36).slice(2);
  updateToasts([...toasts, { id, message, type }]);
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastData[]>([]);

  useEffect(() => {
    toastListeners.push(setItems);
    return () => { toastListeners = toastListeners.filter(l => l !== setItems); };
  }, []);

  const remove = (id: string) => updateToasts(toasts.filter(t => t.id !== id));

  if (!items.length) return null;
  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 items-center">
      {items.map(t => <ToastItem key={t.id} toast={t} onRemove={remove} />)}
    </div>
  );
}
