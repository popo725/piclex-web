import { sha256 } from './archive.mjs';
export const coverRoles = ['landscape', 'portrait'];
export const maximumCoverBytes = 2 * 1024 * 1024;
const fail = () => { throw new Error('独立封面校验失败，请重新导出卡组。'); };
export function validateCoverInfo(info, role) {
  if (!info || info.mimeType !== 'image/jpeg' || !/^[a-f0-9]{64}$/.test(info.sha256) || !Number.isSafeInteger(info.bytes) || info.bytes < 1 || info.bytes > maximumCoverBytes || ![info.width, info.height].every(n => Number.isInteger(n) && n >= 64 && n <= 4096) || !coverRoles.includes(role) || (role === 'landscape' ? info.width <= info.height : info.height <= info.width)) fail();
}
function dimensions(bytes) {
  if (bytes[0] !== 255 || bytes[1] !== 216 || bytes.at(-2) !== 255 || bytes.at(-1) !== 217) fail();
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset++] !== 255) fail();
    while (bytes[offset] === 255) offset++;
    const marker = bytes[offset++];
    if (marker === 218 || marker === 217) break;
    if (marker === 1 || marker >= 208 && marker <= 215) continue;
    const length = bytes[offset] * 256 + bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) fail();
    if ([192, 193, 194].includes(marker)) {
      if (length < 8) fail();
      return [bytes[offset + 5] * 256 + bytes[offset + 6], bytes[offset + 3] * 256 + bytes[offset + 4]];
    }
    offset += length;
  }
  fail();
}
export async function parseEmbeddedCovers(value) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== 2 || !coverRoles.every(role => Object.hasOwn(value, role))) fail();
  /** @type {Record<string, {bytes: Uint8Array, mime: string, width: number, height: number}>} */
  const result = {};
  for (const role of coverRoles) {
    const info = value[role]; validateCoverInfo(info, role);
    if (typeof info.dataBase64 !== 'string' || info.dataBase64.length !== Math.ceil(info.bytes / 3) * 4 || !/^[A-Za-z0-9+/]+={0,2}$/.test(info.dataBase64)) fail();
    let bytes; try { bytes = Uint8Array.from(atob(info.dataBase64), c => c.charCodeAt(0)); } catch { fail(); }
    if (bytes.length !== info.bytes || await sha256(bytes) !== info.sha256) fail();
    const [width, height] = dimensions(bytes);
    if (width !== info.width || height !== info.height) fail();
    result[role] = { bytes, mime: info.mimeType, width, height };
  }
  return result;
}
