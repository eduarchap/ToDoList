/** Dimensiones del lienzo de la pizarra (coordenadas internas, en px). */
export const BOARD_W = 2400
export const BOARD_H = 1600

/** Anchura fija de una nota. */
export const NOTE_W = 184

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}
