'use client';

import { create } from 'zustand';
import type { Toast } from '@/types';

interface UIStore {
  isSidebarOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useUIStore = create<UIStore>((set, get) => ({
  isSidebarOpen: false,
  activeModal: null,
  toasts: [],

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),

  openSidebar: () => set({ isSidebarOpen: true }),

  closeSidebar: () => set({ isSidebarOpen: false }),

  openModal: (id: string) => set({ activeModal: id }),

  closeModal: () => set({ activeModal: null }),

  addToast: (toast: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID();
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    set((state) => ({ toasts: [...state.toasts, newToast] }));

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }
  },

  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () => set({ toasts: [] }),
}));

// Convenience toast helpers
export const toast = {
  success: (title: string, description?: string) => {
    useUIStore.getState().addToast({ title, description, variant: 'success' });
  },
  error: (title: string, description?: string) => {
    useUIStore.getState().addToast({ title, description, variant: 'error' });
  },
  warning: (title: string, description?: string) => {
    useUIStore.getState().addToast({ title, description, variant: 'warning' });
  },
  default: (title: string, description?: string) => {
    useUIStore.getState().addToast({ title, description, variant: 'default' });
  },
};
