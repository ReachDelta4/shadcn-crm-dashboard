import crypto from 'crypto'

function getKey(): Buffer {
  const raw = process.env.DEVICE_CODE_ENC_KEY || ''
  if (!raw) throw new Error('DEVICE_CODE_ENC_KEY is not set')
  // Accept 32-byte base64 or hex; otherwise derive via sha256
  try {
    if (raw.length === 44 && raw.endsWith('=')) return Buffer.from(raw, 'base64')
    if (raw.length === 64) return Buffer.from(raw, 'hex')
  } catch {}
  return crypto.createHash('sha256').update(raw).digest()
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`
}

export function decrypt(packed: string): string {
  const key = getKey()
  const [ivB64, tagB64, dataB64] = (packed || '').split(':')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed ciphertext')
  const iv = Buffer.from(ivB64, 'base64')
  const tag = Buffer.from(tagB64, 'base64')
  const data = Buffer.from(dataB64, 'base64')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  const dec = Buffer.concat([decipher.update(data), decipher.final()])
  return dec.toString('utf8')
}
