import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export interface SeparatorPreset {
  value: string
  label: string
  separator: string
}

export const DEFAULT_SEPARATOR_PRESETS: SeparatorPreset[] = [
  { value: 'space', label: 'Пробел', separator: ' ' },
  { value: 'tab', label: 'Табуляция', separator: '\t' },
  { value: 'comma', label: 'Запятая', separator: ',' },
  { value: 'semicolon', label: 'Точка с запятой', separator: ';' },
  { value: 'newline', label: 'Перевод строки', separator: '\n' },
  { value: 'custom', label: 'Другой', separator: '' },
]

export function presetForSeparator(
  separator: string,
  presets: SeparatorPreset[] = DEFAULT_SEPARATOR_PRESETS
): string {
  const preset = presets.find((p) => p.value !== 'custom' && p.separator === separator)
  return preset?.value ?? 'custom'
}

interface SeparatorFieldProps {
  value: string
  onChange: (separator: string) => void
  presets?: SeparatorPreset[]
}

export function SeparatorField({
  value,
  onChange,
  presets = DEFAULT_SEPARATOR_PRESETS,
}: SeparatorFieldProps) {
  const activePreset = presetForSeparator(value, presets)

  return (
    <div className="flex items-center gap-2">
      <Select
        items={Object.fromEntries(presets.map((p) => [p.value, p.label]))}
        value={activePreset}
        onValueChange={(preset) => {
          if (!preset) return
          if (preset === 'custom') {
            onChange('')
            return
          }
          const found = presets.find((p) => p.value === preset)
          onChange(found?.separator ?? '')
        }}
      >
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {presets.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activePreset === 'custom' && (
        <Input
          className="w-24"
          placeholder="Символ"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
