/**
 * Global toast store for professional, non-blocking error/success/info messages.
 * Use instead of Alert.alert for better UX.
 */

import { create } from 'zustand';

export type ToastType = 'error' | 'success' | 'info';

export interface ToastState {
  visible: boolean;
  message: string;
  title?: string;
  type: ToastType;
}

interface ToastStore extends ToastState {
  _timeout?: ReturnType<typeof setTimeout>;
  show: (options: { message: string; title?: string; type?: ToastType }) => void;
  hide: () => void;
  error: (message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  visible: false,
  message: '',
  type: 'info',
  _timeout: undefined,
  show: (options) => {
    const prev = get();
    if (prev._timeout) clearTimeout(prev._timeout);
    set({
      visible: true,
      message: options.message,
      title: options.title,
      type: options.type ?? 'info',
    });
    const timeout = setTimeout(() => set({ visible: false }), 4000);
    set({ _timeout: timeout });
  },
  hide: () => set({ visible: false }),
  error: (message, title) => get().show({ message, title: title ?? 'Error', type: 'error' }),
  success: (message, title) => get().show({ message, title: title ?? 'Success', type: 'success' }),
  info: (message, title) => get().show({ message, title, type: 'info' }),
}));

/** Helper to get user-friendly message from API or unknown error */
export function getErrorMessage(error: any): string {
  if (!error) return 'Something went wrong. Please try again.';
  if (typeof error === 'string') return error;
  const msg = error?.message ?? error?.error;
  if (msg && typeof msg === 'string') return msg;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  return 'Something went wrong. Please try again.';
}
