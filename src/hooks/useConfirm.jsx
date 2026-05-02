import { useState, useCallback } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

/**
 * window.confirm() o'rniga ishlatish uchun hook.
 *
 * const { confirm, ConfirmDialog } = useConfirm();
 *
 * // JSX'da:
 * return <>{ConfirmDialog}{...}</>
 *
 * // Handler'da:
 * const ok = await confirm({ title: "...", variant: "danger" });
 * if (!ok) return;
 */
export function useConfirm() {
  const [state, setState] = useState({
    isOpen: false,
    title: '',
    description: '',
    variant: 'danger',
    confirmText: undefined,
    cancelText: 'Bekor qilish',
    isLoading: false,
    resolve: null,
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title || 'Tasdiqlaysizmi?',
        description: options.description || '',
        variant: options.variant || 'danger',
        confirmText: options.confirmText,
        cancelText: options.cancelText || 'Bekor qilish',
        isLoading: false,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    state.resolve?.(true);
    setState((s) => ({ ...s, isOpen: false }));
  }, [state]);

  const handleClose = useCallback(() => {
    state.resolve?.(false);
    setState((s) => ({ ...s, isOpen: false }));
  }, [state]);

  const dialog = (
    <ConfirmDialog
      isOpen={state.isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={state.title}
      description={state.description}
      variant={state.variant}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      isLoading={state.isLoading}
    />
  );

  return { confirm, ConfirmDialog: dialog };
}
