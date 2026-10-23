import { create } from 'zustand';

/** Le chargement de depart est-il en cours ? Ecrit par `StartupSplash`, lu par l'accueil (barre ou boutons). */
export const useStartup = create<{ loading: boolean }>(() => ({ loading: true }));
