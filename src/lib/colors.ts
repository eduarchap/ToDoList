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
