"use client"

import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"
import { ChevronDownIcon, CheckIcon } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SearchableSelectItem {
  value: string
  label: string
}

interface SearchableSelectProps {
  items: SearchableSelectItem[]
  value?: string
  onValueChange: (value: string | undefined) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
}

function SearchableSelect({
  items,
  value,
  onValueChange,
  placeholder = "Выберите...",
  searchPlaceholder = "Поиск...",
  emptyMessage = "Ничего не найдено",
  className,
  disabled,
}: SearchableSelectProps) {
  const selectedItem = React.useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value]
  )

  return (
    <Combobox.Root
      items={items}
      value={selectedItem}
      onValueChange={(item) => onValueChange(item ? item.value : undefined)}
      isItemEqualToValue={(a, b) => a?.value === b?.value}
      disabled={disabled}
    >
      <Combobox.Trigger
        className={cn(
          "flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-2 pl-2.5 text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground dark:bg-input/30 dark:hover:bg-input/50",
          className
        )}
      >
        <span className="flex flex-1 truncate text-left">
          <Combobox.Value placeholder={placeholder}>
            {(item: SearchableSelectItem | null) => item?.label ?? placeholder}
          </Combobox.Value>
        </span>
        <Combobox.Icon>
          <ChevronDownIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
        </Combobox.Icon>
      </Combobox.Trigger>
      <Combobox.Portal>
        <Combobox.Positioner className="isolate z-50" sideOffset={4} align="start">
          <Combobox.Popup className="w-(--anchor-width) min-w-48 origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95">
            <div className="border-b p-1">
              <Combobox.Input
                placeholder={searchPlaceholder}
                className="w-full rounded-md bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <Combobox.Empty className="px-3 py-2 text-sm text-muted-foreground">
              {emptyMessage}
            </Combobox.Empty>
            <Combobox.List className="max-h-64 scroll-my-1 overflow-y-auto p-1">
              {(item: SearchableSelectItem) => (
                <Combobox.Item
                  key={item.value}
                  value={item}
                  className="relative flex w-full cursor-default items-center gap-1.5 rounded-md py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {item.label}
                  <Combobox.ItemIndicator className="pointer-events-none absolute right-2 flex size-4 items-center justify-center">
                    <CheckIcon className="pointer-events-none size-4" />
                  </Combobox.ItemIndicator>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}

export { SearchableSelect }
