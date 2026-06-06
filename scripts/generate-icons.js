const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const outDir = path.join(__dirname, '..', 'public', 'icons')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

function makeSvg(size) {
  const r = Math.round(size * 0.18)
  const fontSize = Math.round(size * 0.36)
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="#0f0f0f"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle"
        font-family="Arial, sans-serif" font-weight="700" font-size="${fontSize}"
        fill="#F2F2F0" letter-spacing="1">ML</text>
</svg>`
}

async function generate(size, filename) {
  const svg = Buffer.from(makeSvg(size))
  await sharp(svg).png().toFile(path.join(outDir, filename))
  console.log(`Generated ${filename} (${size}x${size})`)
}

;(async () => {
  await generate(192, 'icon-192.png')
  await generate(512, 'icon-512.png')
  await generate(180, 'apple-touch-icon.png')
  console.log('Icons generated successfully.')
})()
