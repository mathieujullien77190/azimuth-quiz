import type { CSSProperties, ReactNode } from 'react';

/**
 * One labelled, bordered box in `ComponentGalleryView`: the folder name as the label, the real
 * (react-native-web-rendered) component underneath. `height`/`row` are the only two layout
 * escape hatches actually needed by the current gallery — see their own callers for why
 * (`Screen` needs a real flex height to not collapse to 0; a few components are shown as a
 * row of several small variants rather than one instance).
 */
export const GalleryItem = ({
  label,
  height,
  row = false,
  children,
}: {
  label: string;
  /** Fixed pixel height for the body: only `Screen` needs this (see its own gallery entry). */
  height?: number;
  /** Lays multiple example instances out side by side instead of stacking one. */
  row?: boolean;
  children: ReactNode;
}) => {
  const bodyStyle: CSSProperties = height !== undefined ? { height } : {};

  return (
    <div className="gallery-item">
      <p className="gallery-item-label">{label}</p>
      <div className={row ? 'gallery-item-row' : 'gallery-item-body'} style={bodyStyle}>
        {children}
      </div>
    </div>
  );
};
