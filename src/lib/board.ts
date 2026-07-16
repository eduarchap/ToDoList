/** Dimensiones del lienzo de la pizarra (coordenadas internas, en px). */
export const BOARD_W = 2400
export const BOARD_H = 1600

/** Anchura por defecto de una nota. */
export const NOTE_W = 184

/** Límites de redimensionado de una nota (px del lienzo). */
export const NOTE_MIN_W = 130
export const NOTE_MAX_W = 560
export const NOTE_MIN_H = 90
export const NOTE_MAX_H = 720

/** Límites de zoom del lienzo. */
export const MIN_SCALE = 0.4
export const MAX_SCALE = 2.5

export function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}
