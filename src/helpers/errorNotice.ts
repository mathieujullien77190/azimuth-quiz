import { create } from 'zustand';

type ErrorNoticeState = {
  /** A game action just failed: the notice is on screen (see `components/ErrorNoticeHost`). */
  visible: boolean;
  show: () => void;
  hide: () => void;
};

export const useErrorNotice = create<ErrorNoticeState>()((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
