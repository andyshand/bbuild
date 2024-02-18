import { useContext } from 'react';
import { ErrorToast, SuccessToast, WarningToast } from './ToastComponents';
import { ToastContext } from './ToastContext';
import { useInterval } from './useInterval';

export function ToastRenderer() {
  const { toasts, setToasts } = useContext(ToastContext);

  useInterval(() => {
    const newToasts = toasts.filter((t) => t.until > Date.now());
    if (newToasts.length > 0 || newToasts.length < toasts.length) {
      setToasts(newToasts);
    }
  }, 100);

  return (
    <div className="fixed top-0 left-1/2 transform -translate-x-1/2 p-4 flex flex-col gap-2 z-[2050]">
      {toasts.map((toast) => {
        let ToastComponent;
        switch (toast.type) {
          case 'success':
            ToastComponent = SuccessToast;
            break;
          case 'error':
            ToastComponent = ErrorToast;
            break;
          case 'warning':
            ToastComponent = WarningToast;
            break;
          default:
            ToastComponent = SuccessToast;
        }

        return (
          <div key={toast.id}>
            <div className="flex flex-row gap-2">
              <ToastComponent>{toast.data}</ToastComponent>
            </div>
          </div>
        );
      })}
    </div>
  );
}
