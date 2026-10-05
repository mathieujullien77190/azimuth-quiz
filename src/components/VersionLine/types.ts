import type { StyleProp, TextStyle } from 'react-native';

import type { Codename } from '@/helpers/version';

export type VersionLineProps = {
  version: string;
  /** The animal of the version; undefined: just "v2.65.0". */
  codename: Codename | undefined;
  /** The text style of the line (size, colour, alignment): the caller's, the link only adds its own colour and underline. */
  style?: StyleProp<TextStyle>;
};
