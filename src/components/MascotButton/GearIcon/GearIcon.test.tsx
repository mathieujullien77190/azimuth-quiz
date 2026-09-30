import { render } from '@testing-library/react-native';
import Svg from 'react-native-svg';

import { GearIcon } from '.';

describe('GearIcon', () => {
  it('renders inside an SVG at any radius and angle', async () => {
    await render(
      <Svg height={40} width={40}>
        <GearIcon angleDeg={90} color="#ffffff" radius={10} />
      </Svg>,
    );
  });
});
