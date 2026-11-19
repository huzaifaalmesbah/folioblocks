import { tr } from '../i18n/ui';

export type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  danger: boolean;
  resolve: (ok: boolean) => void;
};

let show: ((request: ConfirmRequest) => void) | null = null;

/** Called by ConfirmHost when it mounts (and with null when it unmounts). */
export function setConfirmHost(handler: ((request: ConfirmRequest) => void) | null) {
  show = handler;
}

/**
 * Ask the student to confirm a change, in the site's own dialog instead of the
 * browser's. Resolves true on the confirm button, false on Cancel, Esc or a
 * click outside. Falls back to window.confirm if no ConfirmHost is mounted.
 */
export function askConfirm(
  title: string,
  options: { message?: string; confirmLabel?: string; danger?: boolean } = {},
): Promise<boolean> {
  const { message = '', confirmLabel = tr('OK'), danger = false } = options;
  return new Promise((resolve) => {
    if (!show) {
      resolve(window.confirm([title, message].filter(Boolean).join('\n\n')));
      return;
    }
    show({ title, message, confirmLabel, danger, resolve });
  });
}
