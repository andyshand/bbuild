import { useState } from 'react';
import { ToastContext, ToastType } from './ToastContext';
import { ToastRenderer } from './ToastRenderer';

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState<ToastType[]>([])

  const createToast = (type, data) => {
    const id = Date.now()
    setToasts([...toasts, { id, type, data, until: Date.now() + 5000 }])
  }

  return (
    <ToastContext.Provider value={{ toasts, setToasts, createToast }}>
      {children}
      <ToastRenderer />
    </ToastContext.Provider>
  )
}