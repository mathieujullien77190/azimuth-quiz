import { useEffect } from 'react';

import { useErrorNotice } from '@/helpers/errorNotice';
import { useTranslation } from '@/i18n';

import NoticeOverlay from '@/components/NoticeOverlay';

import { NOTICE_DURATION_MS } from './constants';

/**
 * Notice d'une action de jeu echouee (`reportError`, kind `game`) : montee une fois a la racine,
 * elle disparait au tap ou seule apres quelques secondes.
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
