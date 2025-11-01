function seedToNumber(seed: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function utf8ToUint8(input: string): Uint8Array {
  return new TextEncoder().encode(input!)
}

function uint8ToUtf8(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes!)
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  return btoa(binary)
}

function base64ToUint8(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export function mask(value: string, seed: string): string {
  const seedNum = seedToNumber(seed)
  const rng = mulberry32(seedNum)

  const plain = utf8ToUint8(value)
  const out = new Uint8Array(plain.length)

  for (let i = 0; i < plain.length; i++) {
    const k: number = Math.floor(rng() * 256)
    out[i] = (plain[i] ?? 0) ^ k
  }

  const b64 = uint8ToBase64(out)
  return b64
}

export function unmask(maskedBase64: string, seed: string): string {
  const seedNum = seedToNumber(seed)
  const rng = mulberry32(seedNum)

  const data = base64ToUint8(maskedBase64)
  const out = new Uint8Array(data.length)

  for (let i = 0; i < data.length; i++) {
    const k: number = Math.floor(rng() * 256)
    out[i] = (data[i] ?? 0) ^ k
  }

  const result = uint8ToUtf8(out)
  return result
}
