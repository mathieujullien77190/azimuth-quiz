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

  it('strokes the whole outline as one path when no coast is given', async () => {
    const { toJSON } = await render(<ContourBoard height={50} outline={outline} width={100} />);
    const json = JSON.stringify(toJSON());
    expect(json).toContain('"strokeWidth":3');
    expect(json).not.toContain('"strokeWidth":1.5');
  });

  it('strokes coast and shared borders as separate paths, and the neighbors not at all', async () => {
    const { toJSON } = await render(
      <ContourBoard
        borders={[
          [
            { x: 100, y: 0 },
            { x: 100, y: 50 },
          ],
        ]}
        coastlines={[
          [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
        ]}
        height={50}
        neighborOutlines={[
          [
            { x: 100, y: 0 },
            { x: 150, y: 0 },
            { x: 100, y: 50 },
          ],
        ]}
        outline={outline}
        width={100}
      />,
    );
    const json = JSON.stringify(toJSON());
    // silhouette fill + neighbor fill + coast + border
    expect(json.match(/RNSVGPath/g)).toHaveLength(4);
    expect(json).toContain('"strokeWidth":3');
    expect(json).toContain('"strokeWidth":1.5');
    expect(json).toContain('M 100 0 L 100 50');
    // only the two lines carry a stroke: the fills (silhouette, neighbor) have none
    expect(json.match(/"stroke":/g)).toHaveLength(2);
  });

  it('draws no coast path when the whole outline is shared border', async () => {
    const { toJSON } = await render(
      <ContourBoard borders={[outline]} coastlines={[]} height={50} outline={outline} width={100} />,
    );
    const json = JSON.stringify(toJSON());
    expect(json).not.toContain('"strokeWidth":3');
    expect(json).toContain('"strokeWidth":1.5');
  });

  it('fills the silhouette with the surface color by day, and the raised one by night', async () => {
    const night = await render(<ContourBoard height={50} outline={outline} width={100} />);
    const nightJson = JSON.stringify(night.toJSON());
    await night.unmount();
    const day = await render(inDay(<ContourBoard height={50} outline={outline} width={100} />));
    expect(JSON.stringify(day.toJSON())).not.toBe(nightJson);
  });
});
