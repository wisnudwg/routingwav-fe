"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export type ComboboxOption = {
  value: string
  label: string
  /** Extra text matched by the search box (codes, aliases…) */
  searchText?: string
  /** Row content in the list (defaults to label) */
  render?: React.ReactNode
  /** Content shown in the closed trigger (defaults to label) */
  display?: React.ReactNode
}

type ComboboxProps = {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  id?: string
  invalid?: boolean
  disabled?: boolean
  className?: string
  panelClassName?: string
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Pilih…",
  searchPlaceholder = "Cari…",
  emptyText = "Tidak ditemukan",
  id,
  invalid,
  disabled,
  className,
  panelClassName,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const listId = useId()

  const selected = options.find((o) => o.value === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) =>
      `${o.label} ${o.searchText ?? ""}`.toLowerCase().includes(q)
    )
  }, [options, query])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  // Focus search box when opened
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Keep the highlighted row visible
  useEffect(() => {
    if (!open) return
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [open, active])

  function openPanel() {
    setQuery("")
    setActive(Math.max(options.findIndex((o) => o.value === value), 0))
    setOpen(true)
  }

  function select(o: ComboboxOption) {
    onChange(o.value)
    setOpen(false)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault() // never submit the surrounding form
      const o = filtered[active]
      if (o) select(o)
    } else if (e.key === "Escape") {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openPanel())}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-colors",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
          className
        )}
      >
        <span
          className={cn(
            "flex min-w-0 items-center gap-2 truncate",
            !selected && "text-muted-foreground"
          )}
        >
          {selected ? (selected.display ?? selected.label) : placeholder}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
      </button>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-50 mt-1 w-full min-w-64 rounded-md border bg-popover text-popover-foreground shadow-md",
            panelClassName
          )}
        >
          <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 opacity-50" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActive(0)
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              aria-controls={listId}
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          <ul ref={listRef} id={listId} role="listbox" className="max-h-60 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </li>
            )}
            {filtered.map((o, i) => (
              <li
                key={o.value}
                role="option"
                aria-selected={o.value === value}
                data-index={i}
                onMouseEnter={() => setActive(i)}
                onClick={() => select(o)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                  i === active && "bg-accent text-accent-foreground"
                )}
              >
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  {o.render ?? o.label}
                </span>
                {o.value === value && <Check className="size-4 shrink-0" aria-hidden />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}