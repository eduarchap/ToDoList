import type { ReactNode } from 'react'

/** Aplica un comando de formato a la selección activa del editor enfocado. */
function exec(cmd: string, value?: string) {
  try {
    document.execCommand('styleWithCSS', false, 'true')
  } catch {
    /* ignore */
  }
  document.execCommand(cmd, false, value)
}

const TEXT_COLORS = ['#111827', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#db2777']

const FONTS = [
  { label: 'Sans', value: 'Inter, system-ui, sans-serif' },
  { label: 'Serif', value: 'Georgia, serif' },
  { label: 'Mono', value: '"Courier New", monospace' },
]

// Tamaños de fuente de execCommand (1–7).
const SIZES = [
  { label: 'Pequeña', value: '2' },
  { label: 'Normal', value: '3' },
  { label: 'Grande', value: '5' },
  { label: 'Enorme', value: '7' },
]

/**
 * Barra de formato flotante. Los controles usan onMouseDown+preventDefault para
 * NO robar el foco al editor (así la selección se conserva al pulsar).
 */
export function FormatToolbar() {
  const hold = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault()
    fn()
  }

  return (
    <div className="fixed left-1/2 top-14 z-[55] flex max-w-[95vw] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/95 px-2 py-1.5 shadow-2xl backdrop-blur no-scrollbar">
      <Btn label="Negrita" onClick={hold(() => exec('bold'))}>
        <span className="font-bold">B</span>
      </Btn>
      <Btn label="Cursiva" onClick={hold(() => exec('italic'))}>
        <span className="italic font-serif">I</span>
      </Btn>
      <Btn label="Subrayado" onClick={hold(() => exec('underline'))}>
        <span className="underline">U</span>
      </Btn>
      <Btn label="Tachado" onClick={hold(() => exec('strikeThrough'))}>
        <span className="line-through">S</span>
      </Btn>

      <Divider />

      <div className="flex items-center gap-1">
        {TEXT_COLORS.map((c) => (
          <button
            key={c}
            title="Color de texto"
            aria-label={`Color ${c}`}
            onMouseDown={hold(() => exec('foreColor', c))}
            className="h-5 w-5 shrink-0 rounded-full ring-1 ring-white/20"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <Divider />

      <select
        title="Tamaño"
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          exec('fontSize', e.target.value)
          e.target.selectedIndex = 0
        }}
        defaultValue=""
        className="shrink-0 rounded-lg bg-slate-800 px-1.5 py-1 text-xs text-slate-200 focus:outline-none [color-scheme:dark]"
      >
        <option value="" disabled>
          Tamaño
        </option>
        {SIZES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        title="Fuente"
        onChange={(e) => {
          exec('fontName', e.target.value)
          e.target.selectedIndex = 0
        }}
        defaultValue=""
        className="shrink-0 rounded-lg bg-slate-800 px-1.5 py-1 text-xs text-slate-200 focus:outline-none [color-scheme:dark]"
      >
        <option value="" disabled>
          Fuente
        </option>
        {FONTS.map((f) => (
          <option key={f.label} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <Divider />

      <Btn label="Quitar formato" onClick={hold(() => exec('removeFormat'))}>
        <span className="text-xs">✕</span>
      </Btn>
    </div>
  )
}

function Btn({ children, label, onClick }: { children: ReactNode; label: string; onClick: (e: React.MouseEvent) => void }) {
  return (
    <button
      title={label}
      aria-label={label}
      onMouseDown={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-200 transition hover:bg-slate-800"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-slate-700" />
}
