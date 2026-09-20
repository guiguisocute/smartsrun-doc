// JSON.parse validates syntax; this bounded pass additionally rejects duplicate
// object keys so browser decisions agree with the device's strict decoder.
export function parseStrictJSON(text, limit = 256 * 1024) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > limit) throw Error('JSON 超过大小限制')
  const result = JSON.parse(text)
  let offset = 0
  const whitespace = () => { while (/\s/.test(text[offset] || '') && offset < text.length) offset++ }
  function string() {
    const start = offset++
    while (text[offset] !== '"') offset += text[offset] === '\\' ? 2 : 1
    offset++
    return JSON.parse(text.slice(start, offset))
  }
  function value(depth) {
    if (depth > 32) throw Error('JSON 嵌套过深')
    whitespace()
    if (text[offset] === '{') {
      offset++; whitespace()
      const keys = new Set()
      while (text[offset] !== '}') {
        whitespace()
        const key = string()
        if (keys.has(key)) throw Error('JSON 字段重复')
        keys.add(key); whitespace(); offset++
        value(depth + 1); whitespace()
        if (text[offset] === ',') offset++
      }
      offset++
    } else if (text[offset] === '[') {
      offset++; whitespace()
      while (text[offset] !== ']') { value(depth + 1); whitespace(); if (text[offset] === ',') offset++ }
      offset++
    } else if (text[offset] === '"') string()
    else while (offset < text.length && !/[\s,}\]]/.test(text[offset])) offset++
  }
  value(0)
  return result
}
