import { create } from 'zustand';

type ErrorNoticeState = {
  /** Une action de jeu vient d'echouer : la notice est affichee (voir `components/providers/ErrorNoticeHost`). */
  visible: boolean;
  show: () => void;
  hide: () => void;
};

export const useErrorNotice = create<ErrorNoticeState>()((set) => ({
  visible: false,
  show: () => set({ visible: true }),
  hide: () => set({ visible: false }),
}));
