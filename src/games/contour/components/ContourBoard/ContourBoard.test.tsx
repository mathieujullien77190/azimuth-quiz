import { render } from '@testing-library/react-native';

import { ThemeSettingsContext } from '@/themes';

import ContourBoard from '.';

const outline = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 50 },
];

const inDay = (children: React.ReactNode) => (
  <ThemeSettingsContext.Provider
    value={{
      themeId: 'day',
      ready: true,
      setThemeId: jest.fn(),
      resetThemeId: jest.fn(),
      animationsEnabled: false,
      setAnimationsEnabled: jest.fn(),
      resetAnimationsEnabled: jest.fn(),
    }}
  >
    {children}
  </ThemeSettingsContext.Provider>
);

describe('ContourBoard', () => {
  it('draws the outline at the requested canvas size', async () => {
    const { toJSON } = await render(<ContourBoard height={50} outline={outline} width={100} />);
    const json = JSON.stringify(toJSON());
    expect(json).toContain('"width":100');
    expect(json).toContain('"height":50');
    expect(json).toContain('M');
  });

  it('draws no label when there are no hints, by default', async () => {
    const { toJSON } = await render(<ContourBoard height={50} outline={outline} width={100} />);
    expect(JSON.stringify(toJSON())).not.toContain('RNSVGText');
  });

  it('draws every hint label: flags as icons, names as plain text', async () => {
    const { toJSON } = await render(
      <ContourBoard
        height={50}
        hintLabels={[
          { position: { x: 10, y: 10 }, icon: true, text: '🇫🇷' },
          { position: { x: 10, y: 25 }, text: 'France' },
        ]}
        outline={outline}
        width={100}
      />,
    );
    const json = JSON.stringify(toJSON());
    expect(json).toContain('🇫🇷');
    expect(json).toContain('France');
  });

  it('fills the silhouette with the surface color by day, and the raised one by night', async () => {
    const night = await render(<ContourBoard height={50} outline={outline} width={100} />);
    const nightJson = JSON.stringify(night.toJSON());
    await night.unmount();
    const day = await render(inDay(<ContourBoard height={50} outline={outline} width={100} />));
    expect(JSON.stringify(day.toJSON())).not.toBe(nightJson);
  });
});
