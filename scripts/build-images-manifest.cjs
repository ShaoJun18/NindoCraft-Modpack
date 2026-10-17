// Standalone generator for the public image repository. No npm dependencies.
const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')
const fail = message => { throw new Error(message) }
function imageHeader(data, format) {
    let width = 0
    let height = 0
    if(format === 'png') {
        if(data.length < 33 || data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a' || data.toString('ascii', 12, 16) !== 'IHDR') fail('Le fichier reçu n’est pas une image PNG.')
        width = data.readUInt32BE(16)
        height = data.readUInt32BE(20)
    } else if(format === 'jpeg') {
        if(data[0] !== 0xff || data[1] !== 0xd8) fail('Le fichier reçu n’est pas une image JPEG.')
        let offset = 2
        while(offset + 9 < data.length) {
            if(data[offset++] !== 0xff) fail('Structure JPEG invalide.')
            while(data[offset] === 0xff) offset++
            const marker = data[offset++]
            if(marker === 0xda || marker === 0xd9) break
            if(marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
            const length = data.readUInt16BE(offset)
            if(length < 2 || offset + length > data.length) fail('Segment JPEG invalide.')
            if([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
                height = data.readUInt16BE(offset + 3)
                width = data.readUInt16BE(offset + 5)
                break
            }
            offset += length
        }
    } else {
        if(data.length < 30 || data.toString('ascii', 0, 4) !== 'RIFF' || data.toString('ascii', 8, 12) !== 'WEBP') fail('Le fichier reçu n’est pas une image WebP.')
        const type = data.toString('ascii', 12, 16)
        if(type === 'VP8X') { width = 1 + data.readUIntLE(24, 3); height = 1 + data.readUIntLE(27, 3) }
        else if(type === 'VP8L' && data[20] === 0x2f) { const bits = data.readUInt32LE(21); width = 1 + (bits & 0x3fff); height = 1 + ((bits >>> 14) & 0x3fff) }
        else if(type === 'VP8 ') { width = data.readUInt16LE(26) & 0x3fff; height = data.readUInt16LE(28) & 0x3fff }
    }
    if(width < 1 || height < 1 || width > 8192 || height > 8192 || width * height > 32 * 1024 * 1024) fail('Dimensions réelles de l’image invalides ou trop grandes.')
    return { width, height }
}


const FALLBACKS = [
    ...Array.from({ length: 8 }, (_, i) => `backgrounds/${i}.jpg`),
    'NindoCraft.svg', 'NindoCraft.png', 'SealCircle.png', 'LoadingSeal.png', 'LoadingText.png',
    'icons/settings.svg', 'icons/discord.svg', 'icons/profile.svg', 'icons/link.svg'
]
const SCREEN_ROLES = ['welcome', 'account', 'main', 'settings', 'optional-mods', 'loading']
const USAGES = new Set([
    ...Array.from({ length: 32 }, (_, i) => 'background:' + i),
    ...SCREEN_ROLES.map(screen => 'background:' + screen),
    'illustration:welcome', 'illustration:main', 'illustration:loading', 'illustration:settings', 'banner:main',
    'icon:optional-mods', 'icon:settings', 'icon:discord', 'icon:link', 'icon:account', 'icon:application'
])

function validUsage(usage) {
    return USAGES.has(usage) || (typeof usage === 'string' && /^icon:mod:[a-z0-9][a-z0-9_-]{0,63}$/.test(usage))
}

function validateEntry(entry) {
    if(!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(entry.id) || !validUsage(entry.usage) || !FALLBACKS.includes(entry.fallbackAsset)) fail('Identifiant, rôle ou image de secours invalide.')
    if(!Number.isInteger(entry.recommendedWidth) || !Number.isInteger(entry.recommendedHeight) || entry.recommendedWidth < 1 || entry.recommendedHeight < 1 || entry.recommendedWidth > 8192 || entry.recommendedHeight > 8192) fail('Dimensions recommandées invalides.')
    const mode = entry.displayMode
    if(!mode || !['cover', 'contain', 'fill'].includes(mode.fit) || !['center', 'top', 'bottom', 'left', 'right'].includes(mode.position) || typeof mode.allowStretch !== 'boolean' || (mode.fit === 'fill' && !mode.allowStretch)) fail('Mode d’affichage invalide.')
}

async function generate(root, repository, revision) {
    if(!/^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/.test(repository) || !/^[a-f0-9]{40}$/.test(revision)) fail('Dépôt ou commit invalide.')
    const config = JSON.parse(await fs.readFile(path.join(root, 'images/config.json'), 'utf8'))
    if(!Array.isArray(config.images) || config.images.length > 64) fail('Configuration des images invalide.')
    const base = await fs.realpath(path.join(root, 'images'))
    const images = []
    const roles = new Set()
    const ids = new Set()
    for(const entry of config.images) {
        if(entry.enabled === false) continue
        validateEntry(entry)
        const { file, ...metadata } = entry
        delete metadata.enabled
        if(typeof file !== 'string' || !file || file.includes('\\') || path.isAbsolute(file) || file.split('/').some(part => !part || part === '..' || part === '.')) fail('Chemin image invalide.')
        const resolved = await fs.realpath(path.join(base, file))
        if(!resolved.startsWith(base + path.sep)) fail('Image extérieure au dossier autorisé.')
        if(ids.has(entry.id) || roles.has(entry.usage)) fail('Identifiant ou rôle dupliqué.')
        ids.add(entry.id); roles.add(entry.usage)
        const format = ({ '.png': 'png', '.jpg': 'jpeg', '.jpeg': 'jpeg', '.webp': 'webp' })[path.extname(file).toLowerCase()]
        if(!format) fail('Format image autorisé : PNG, JPG ou WebP.')
        const bytes = await fs.readFile(resolved)
        if(bytes.length > 20 * 1024 * 1024) fail('Image trop volumineuse.')
        imageHeader(bytes, format)
        images.push({ ...metadata, version: revision, format, size: bytes.length,
            sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
            url: 'https://raw.githubusercontent.com/' + repository + '/' + revision + '/images/' + file.split('/').map(encodeURIComponent).join('/') })
    }
    return { manifestVersion: 1, assetsVersion: revision, images }
}
if(require.main === module) generate(process.cwd(), process.env.GITHUB_REPOSITORY, process.env.IMAGE_SOURCE_REVISION || process.env.GITHUB_SHA).then(async manifest => {
    await fs.mkdir('image-publish', { recursive: true })
    await fs.writeFile('image-publish/launcher-assets.json', JSON.stringify(manifest, null, 2) + '\n')
    console.log(manifest.images.length + ' images vérifiées ; manifeste prêt.')
}).catch(error => { console.error(error.message); process.exitCode = 1 })
module.exports = { generate }
