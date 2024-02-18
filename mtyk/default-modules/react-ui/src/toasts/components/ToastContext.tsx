import { createContext } from 'react';

// Creating ToastContext inline in this file
export type ToastType = {
  id: string | number;
  type: 'success' | 'error' | 'warning';
  data: string;
  until: number;
};
export type ToastContextType = {
  toasts: ToastType[];
  setToasts: (toasts: ToastType[]) => void;
  createToast: (type: 'success' | 'error' | 'warning', data: string) => void;
};
export const ToastContext = createContext<ToastContextType>({ toasts: [], setToasts: () => { }, createToast: () => { } });
