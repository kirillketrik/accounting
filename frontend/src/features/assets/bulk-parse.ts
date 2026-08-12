import type { AssetBulkItem } from '@/api/types'

export type BulkAssetField = 'name' | 'inventory' | 'serial'

export const VALID_FIELDS: BulkAssetField[] = ['name', 'inventory', 'serial']

export const FIELD_LABELS: Record<BulkAssetField, string> = {
  name: 'Название',
  inventory: 'Инв. номер',
  serial: 'Серийный номер',
}

const TEMPLATE_TOKEN_RE = /\{([a-zA-Z0-9_]+)\}/g

export interface ParsedTemplate {
  fields: BulkAssetField[]
  error?: string
}

/**
 * Extracts the ordered list of {field} placeholders from a template like
 * "{name} {inventory} {serial}". Placeholder extraction is independent of the
 * separator — literal text around/between placeholders is purely cosmetic and
 * doesn't affect validation or line parsing, only the positional field order does.
 */
export function parseTemplate(template: string, separator: string): ParsedTemplate {
  if (!separator) return { fields: [], error: 'Укажите разделитель' }

  const tokens = [...template.matchAll(TEMPLATE_TOKEN_RE)].map((m) => m[1])

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

/**
 * Best-effort ordered list of known fields present in a template — used to
 * initialize/derive the field builder UI. Unlike `parseTemplate`, this never
 * errors: unknown placeholders and repeats are silently dropped.
 */
export function extractTemplateFields(template: string): BulkAssetField[] {
  const tokens = [...template.matchAll(TEMPLATE_TOKEN_RE)].map((m) => m[1])
  const fields: BulkAssetField[] = []
  for (const t of tokens) {
    if (VALID_FIELDS.includes(t as BulkAssetField) && !fields.includes(t as BulkAssetField)) {
      fields.push(t as BulkAssetField)
    }
  }
  return fields
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
