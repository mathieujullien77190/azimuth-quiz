/** Board's max width on a wide screen (mirrors MAX_COMPASS_SIZE/MAX_EARTH_SIZE in
 * GameScreen/constants.ts): below that, boardMaxSizeFor shrinks it to fit the window. */
export const MAX_BOARD_WIDTH = 320;
/** Height cap relative to the computed max width: keeps a very tall, narrow country (Norway)
 * from producing a board dramatically taller than it is wide. */
export const MAX_BOARD_HEIGHT_RATIO = 1.6;
/** Height cap relative to the window's own height too, as a second safety net on short viewports
 * (a max-width-relative cap alone wouldn't catch a wide phone in landscape, say). */
export const MAX_BOARD_HEIGHT_VIEWPORT_RATIO = 0.55;
