import type { AssetBulkItem } from '@/api/types'

export type BulkAssetField = 'name' | 'inventory' | 'serial'

const VALID_FIELDS: BulkAssetField[] = ['name', 'inventory', 'serial']

export interface ParsedTemplate {
  fields: BulkAssetField[]
  error?: string
}

/**
 * Splits a template like "{name} {inventory} {serial}" into an ordered list of
 * field tokens using the given separator. Every token must be one of the known
 * field names (no literal text mixed in), matching the positional-split parsing
 * used for each data line.
 */
export function parseTemplate(template: string, separator: string): ParsedTemplate {
  if (!separator) return { fields: [], error: 'Укажите разделитель' }

  const tokens = template
    .split(separator)
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((t) => t.replace(/^\{|\}$/g, ''))

  if (tokens.length === 0) {
    return { fields: [], error: 'Укажите хотя бы одно поле в шаблоне' }
  }

  const invalid = tokens.filter((t) => !VALID_FIELDS.includes(t as BulkAssetField))
  if (invalid.length > 0) {
    return { fields: [], error: `Неизвестные поля: ${invalid.join(', ')}` }
  }

  const duplicates = tokens.filter((t, i) => tokens.indexOf(t) !== i)
  if (duplicates.length > 0) {
    return { fields: [], error: `Повторяющиеся поля: ${[...new Set(duplicates)].join(', ')}` }
  }

  return { fields: tokens as BulkAssetField[] }
}

export interface ParsedAssetLine {
  raw: string
  name?: string
  inventory_number?: string
  serial_number?: string
  incomplete: boolean
}

/**
 * Splits `line` by `separator` into at most `maxParts` pieces, with the last
 * piece absorbing any remaining separator-containing text. JS has no built-in
 * equivalent of Python's `str.split(sep, maxsplit)`.
 */
function splitWithMaxParts(line: string, separator: string, maxParts: number): string[] {
  if (maxParts <= 1) return [line]
  const parts: string[] = []
  let rest = line
  for (let i = 0; i < maxParts - 1; i++) {
    const idx = rest.indexOf(separator)
    if (idx === -1) {
      parts.push(rest)
      rest = ''
      break
    }
    parts.push(rest.slice(0, idx))
    rest = rest.slice(idx + separator.length)
  }
  if (parts.length < maxParts) parts.push(rest)
  return parts
}

export function parseAssetLine(
  line: string,
  fields: BulkAssetField[],
  separator: string
): ParsedAssetLine {
  const parts = splitWithMaxParts(line, separator, fields.length)
  const result: ParsedAssetLine = { raw: line, incomplete: false }

  fields.forEach((field, i) => {
    const value = parts[i]?.trim()
    if (!value) {
      result.incomplete = true
      return
    }
    if (field === 'name') result.name = value
    else if (field === 'inventory') result.inventory_number = value
    else if (field === 'serial') result.serial_number = value
  })

  return result
}

export function toBulkItems(rows: ParsedAssetLine[]): AssetBulkItem[] {
  return rows.map((row) => {
    const inventoryNumber = row.inventory_number ? Number(row.inventory_number) : undefined
    return {
      name: row.name || undefined,
      inventory_number: Number.isNaN(inventoryNumber as number) ? undefined : inventoryNumber,
      serial_number: row.serial_number || undefined,
    }
  })
}
