import { useEffect } from 'react';

import { useErrorNotice } from '@/helpers/errorNotice';
import { useTranslation } from '@/i18n';

import NoticeOverlay from '@/components/NoticeOverlay';

import { NOTICE_DURATION_MS } from './constants';

/**
 * The notice a failed game action shows (`reportError` with the `game` kind): mounted once at the root, it disappears on
 * tap or by itself after a few seconds.
 */
export const ErrorNoticeHost = () => {
  const t = useTranslation();
  const visible = useErrorNotice((state) => state.visible);
  const hide = useErrorNotice((state) => state.hide);

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(hide, NOTICE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, hide]);

  return <NoticeOverlay message={visible ? t.common.actionFailed : null} onDismiss={hide} />;
};
