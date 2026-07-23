import type { NoteColor } from '../types'

export interface ColorSpec {
  /** Fondo de la nota. */
  bg: string
  /** Fondo de la cabecera (algo más oscuro). */
  header: string
  /** Color del texto. */
  text: string
  /** Nombre legible. */
  label: string
  /** Muestra para el selector. */
  swatch: string
}

/** Paleta pastel estilo post-it, legible sobre pizarra oscura. */
export const COLORS: Record<NoteColor, ColorSpec> = {
  yellow: { bg: '#fde68a', header: '#fcd34d', text: '#713f12', label: 'Amarillo', swatch: '#fbbf24' },
  green: { bg: '#bbf7d0', header: '#86efac', text: '#14532d', label: 'Verde', swatch: '#4ade80' },
  blue: { bg: '#bfdbfe', header: '#93c5fd', text: '#1e3a8a', label: 'Azul', swatch: '#60a5fa' },
  pink: { bg: '#fbcfe8', header: '#f9a8d4', text: '#831843', label: 'Rosa', swatch: '#f472b6' },
  orange: { bg: '#fed7aa', header: '#fdba74', text: '#7c2d12', label: 'Naranja', swatch: '#fb923c' },
  purple: { bg: '#e9d5ff', header: '#d8b4fe', text: '#581c87', label: 'Morado', swatch: '#c084fc' },
  gray: { bg: '#e5e7eb', header: '#d1d5db', text: '#374151', label: 'Gris', swatch: '#9ca3af' },
}

export const COLOR_ORDER: NoteColor[] = ['yellow', 'green', 'blue', 'pink', 'orange', 'purple', 'gray']

export const DEFAULT_COLOR: NoteColor = 'yellow'

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null
  const n = parseInt(m[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** Luminancia relativa aproximada (0 oscuro … 1 claro). */
function luminance({ r, g, b }: { r: number; g: number; b: number }): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/** true si el color es un valor hexadecimal (personalizado), no un preset. */
export function isCustomColor(color: string): boolean {
  return !(color in COLORS) && hexToRgb(color) !== null
}

/**
 * Devuelve la especificación visual de un color de nota. Acepta un preset
 * ('yellow'…) o un hex personalizado ('#rrggbb'), del que deriva cabecera y
 * color de texto legible según su luminosidad.
 */
export function resolveColor(color: string): ColorSpec {
  const preset = COLORS[color as NoteColor]
  if (preset) return preset
  const rgb = hexToRgb(color)
  if (!rgb) return COLORS[DEFAULT_COLOR]
  const light = luminance(rgb) > 0.55
  return {
    bg: toHex(rgb.r, rgb.g, rgb.b),
    header: toHex(rgb.r * 0.88, rgb.g * 0.88, rgb.b * 0.88),
    text: light ? '#1f2937' : '#f8fafc',
    label: 'Personalizado',
    swatch: toHex(rgb.r, rgb.g, rgb.b),
  }
}
