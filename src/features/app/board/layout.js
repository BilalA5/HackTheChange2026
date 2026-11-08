/**
 * Lays `count` stops clockwise around a board, starting after the top-left corner: along the top,
 * down the right, back along the bottom and up the left. Each slot carries its grid cell and the side
 * it sits on, so a tile can turn its colour band to face the middle of the board.
 */
export function boardLayout(count) {
  const sides = Math.max(1, Math.round(count * 0.18));
  const across = Math.max(1, Math.ceil((count - 2 * sides) / 2));
  const last = { row: sides + 2, column: across + 2 };

  const slots = [
    ...Array.from({ length: across }, (_, i) => ({ side: 'top', row: 1, column: i + 2 })),
    ...Array.from({ length: sides }, (_, i) => ({ side: 'right', row: i + 2, column: last.column })),
    ...Array.from({ length: across }, (_, i) => ({ side: 'bottom', row: last.row, column: across + 1 - i })),
    ...Array.from({ length: sides }, (_, i) => ({ side: 'left', row: sides + 1 - i, column: 1 })),
  ];

  return {
    across,
    sides,
    slots,
    corners: {
      start: { row: 1, column: 1 },
      portfolio: { row: 1, column: last.column },
      level: last,
      hired: { row: last.row, column: 1 },
    },
    center: { row: `2 / ${last.row}`, column: `2 / ${last.column}` },
  };
}
