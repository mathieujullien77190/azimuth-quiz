type BackRouter = { canGoBack: () => boolean; back: () => void; replace: (href: '/') => void };

/**
 * One step back — or home when there is none: a page opened (or reloaded) straight on a deep route, such as the setup
 * screen on the web, has no history, and `back()` there is "The action 'GO_BACK' was not handled by any navigator"
 * (a red error toast), when the player only meant to leave.
 */
export const goBackOrHome = (router: BackRouter): void => {
  if (router.canGoBack()) router.back();
  else router.replace('/');
};
