import { goBackOrHome } from './goBack';

const routerWith = (canGoBack: boolean) => ({ canGoBack: () => canGoBack, back: jest.fn(), replace: jest.fn() });

describe('goBackOrHome', () => {
  it('goes one step back when there is a history', () => {
    const router = routerWith(true);
    goBackOrHome(router);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('goes home instead when there is nowhere to go back to', () => {
    const router = routerWith(false);
    goBackOrHome(router);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
  });
});
