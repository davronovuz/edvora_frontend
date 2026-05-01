import { toast } from 'sonner';

function extractErrorMessage(error, fallback = "Xatolik yuz berdi") {
  if (typeof error === 'string') return error;

  const data = error?.response?.data;
  if (!data) return error?.message || fallback;

  if (data.error?.message) return data.error.message;
  if (data.detail) return data.detail;
  if (data.non_field_errors?.[0]) return data.non_field_errors[0];

  if (typeof data === 'object') {
    for (const key of Object.keys(data)) {
      const val = data[key];
      if (Array.isArray(val) && val.length > 0) return val[0];
      if (typeof val === 'string') return val;
    }
  }

  return fallback;
}

export const notify = {
  success: (message, options) => toast.success(message, options),
  error: (errorOrMessage, fallback) => {
    const msg = extractErrorMessage(errorOrMessage, fallback);
    toast.error(msg);
  },
  warning: (message, options) => toast.warning(message, options),
  info: (message, options) => toast.info(message, options),
  promise: (promise, messages) => toast.promise(promise, messages),
  withUndo: (message, onUndo, duration = 5000) => {
    toast.success(message, {
      duration,
      action: { label: 'Bekor qilish', onClick: onUndo },
    });
  },
};
