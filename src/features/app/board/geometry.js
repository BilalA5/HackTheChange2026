export const CORNER = 176;
export const TILE = 168;

/**
 * Lays `count` stops clockwise around a board in board pixels, starting after the top-left corner:
 * along the top, down the right, back along the bottom and up the left.
 */
export function boardGeometry(count) {
  const sides = Math.max(1, Math.round(count * 0.18));
  const across = Math.max(1, Math.ceil((count - 2 * sides) / 2));
  const width = 2 * CORNER + across * TILE;
  const height = 2 * CORNER + sides * TILE;

  const slot = (side, x, y, w, h) => ({ side, x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
  const slots = [
    ...Array.from({ length: across }, (_, i) => slot('top', CORNER + i * TILE, 0, TILE, CORNER)),
    ...Array.from({ length: sides }, (_, i) => slot('right', width - CORNER, CORNER + i * TILE, CORNER, TILE)),
    ...Array.from({ length: across }, (_, i) =>
      slot('bottom', CORNER + (across - 1 - i) * TILE, height - CORNER, TILE, CORNER),
    ),
    ...Array.from({ length: sides }, (_, i) => slot('left', 0, CORNER + (sides - 1 - i) * TILE, CORNER, TILE)),
  ];

  const corner = (x, y) => slot('corner', x, y, CORNER, CORNER);

  return {
    width,
    height,
    slots,
    corners: {
      start: corner(0, 0),
      portfolio: corner(width - CORNER, 0),
      level: corner(width - CORNER, height - CORNER),
      hired: corner(0, height - CORNER),
    },
  };
}
