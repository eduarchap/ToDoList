// Saneado de HTML para el contenido enriquecido de las notas.
// Permite solo etiquetas/estilos de formato; elimina scripts, handlers, enlaces, etc.

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'SPAN', 'FONT', 'BR', 'DIV', 'P'])
const ALLOWED_STYLES = [
  'color',
  'background-color',
  'font-size',
  'font-family',
  'text-decoration',
  'font-weight',
  'font-style',
]

function filterAttributes(el: HTMLElement): void {
  const isFont = el.tagName === 'FONT'
  for (const attr of Array.from(el.attributes)) {
    const name = attr.name.toLowerCase()
    if (name === 'style') continue
    if (isFont && (name === 'color' || name === 'size' || name === 'face')) continue
    el.removeAttribute(attr.name)
  }
  if (el.hasAttribute('style')) {
    const kept: string[] = []
    for (const prop of ALLOWED_STYLES) {
      const v = el.style.getPropertyValue(prop)
      // Descarta valores peligrosos (url(), expression()).
      if (v && !/url\(|expression\(|javascript:/i.test(v)) kept.push(`${prop}: ${v}`)
    }
    if (kept.length) el.setAttribute('style', kept.join('; '))
    else el.removeAttribute('style')
  }
}

function cleanChildren(parent: Node): void {
  for (const child of Array.from(parent.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) continue
    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.parentNode?.removeChild(child)
      continue
    }
    const el = child as HTMLElement
    cleanChildren(el) // limpia hijos antes de decidir
    if (ALLOWED_TAGS.has(el.tagName)) {
      filterAttributes(el)
    } else {
      // Desenvuelve: sube los hijos (ya limpios) y elimina la etiqueta no permitida.
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
    }
  }
}

/** Devuelve una versión saneada del HTML (solo formato permitido). */
export function sanitizeHtml(html: string): string {
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  cleanChildren(tpl.content)
  return tpl.innerHTML
}

/** Convierte texto plano en HTML seguro (escapado, con saltos de línea). */
export function textToHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML.replace(/\n/g, '<br>')
}
