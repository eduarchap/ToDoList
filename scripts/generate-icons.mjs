// Genera los iconos PNG de la PWA a partir de un SVG, usando sharp.
// Ejecutar con: npm run icons
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = resolve(__dirname, '../public/icons')
mkdirSync(outDir, { recursive: true })

// Icono estándar (con margen): logo centrado sobre fondo redondeado.
const standardSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#4f46e5"/>
  <path d="M148 268 214 334 372 172" fill="none" stroke="#fff" stroke-width="46"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

// Icono maskable (safe zone ~80%): logo más pequeño, fondo a sangre.
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#4f46e5"/>
  <path d="M170 262 224 316 350 190" fill="none" stroke="#fff" stroke-width="40"
        stroke-linecap="round" stroke-linejoin="round"/>
</svg>`

async function render(svg, size, name) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(resolve(outDir, name))
  console.log('  ✓', name)
}

console.log('Generando iconos PWA…')
await render(standardSvg, 192, 'icon-192.png')
await render(standardSvg, 512, 'icon-512.png')
await render(standardSvg, 180, 'apple-touch-icon.png')
await render(maskableSvg, 512, 'icon-maskable-512.png')
console.log('Listo.')
