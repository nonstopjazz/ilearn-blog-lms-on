import * as React from "react"

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

const SelectContext = React.createContext<{
  value: string
  setValue: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}>({
  value: "",
  setValue: () => {},
  open: false,
  setOpen: () => {}
})

export function Select({ value, defaultValue = "", onValueChange, children }: SelectProps) {
  const [internalValue, setInternalValue] = React.useState(value || defaultValue)
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  const setValue = (newValue: string) => {
    setInternalValue(newValue)
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ value: internalValue, setValue, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { value, open, setOpen } = React.useContext(SelectContext)

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
      <span className="ml-2">▼</span>
    </button>
  )
}

export function SelectValue({ placeholder = "" }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

export function SelectContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { open } = React.useContext(SelectContext)

  if (!open) return null

  return (
    <div className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover text-popover-foreground shadow-md ${className}`}>
      <div className="p-1">
        {children}
      </div>
    </div>
  )
}

export function SelectItem({ value, children, className = "" }: { value: string; children: React.ReactNode; className?: string }) {
  const { setValue, value: selectedValue } = React.useContext(SelectContext)
  const isSelected = selectedValue === value

  return (
    <div
      onClick={() => setValue(value)}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground ${
        isSelected ? "bg-accent text-accent-foreground" : ""
      } ${className}`}
    >
      {children}
    </div>
  )
}