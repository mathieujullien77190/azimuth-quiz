import type { StyleProp, TextStyle } from 'react-native';

import type { Codename } from '@/helpers/appInfo';

export type VersionLineProps = {
  version: string;
  /** Animal de la version ; undefined : juste « v2.65.0 ». */
  codename: Codename | undefined;
  /** Style du texte de la ligne (taille, couleur, alignement) : celui de l'appelant, le lien n'ajoute que couleur et soulignement. */
  style?: StyleProp<TextStyle>;
};
