type BackRouter = { canGoBack: () => boolean; back: () => void; replace: (href: '/') => void };

/** Un pas en arriere, ou l'accueil sans historique (page ouverte sur une route profonde, web) : `back()` y leve une erreur GO_BACK. */
export const goBackOrHome = (router: BackRouter): void => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};
