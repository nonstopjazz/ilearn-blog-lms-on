import * as React from "react"

export interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  className?: string
}

export function Calendar({ selected, onSelect, className = "" }: CalendarProps) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date())
  const [viewDate, setViewDate] = React.useState(selected || new Date())

  const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"]
  const dayNames = ["日", "一", "二", "三", "四", "五", "六"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  const handleDateClick = (date: Date | null) => {
    if (date) {
      setCurrentDate(date)
      onSelect?.(date)
    }
  }

  const isSelected = (date: Date | null) => {
    if (!date || !selected) return false
    return date.toDateString() === selected.toDateString()
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    return date.toDateString() === new Date().toDateString()
  }

  const days = getDaysInMonth(viewDate)

  return (
    <div className={`p-3 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
          className="p-1 hover:bg-accent rounded"
        >
          ‹
        </button>
        <div className="font-medium">
          {monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}
        </div>
        <button
          onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
          className="p-1 hover:bg-accent rounded"
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0 mb-2">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground p-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {days.map((date, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(date)}
            disabled={!date}
            className={`
              p-2 text-sm text-center hover:bg-accent rounded-md
              ${!date ? "invisible" : ""}
              ${isSelected(date) ? "bg-primary text-primary-foreground hover:bg-primary" : ""}
              ${isToday(date) && !isSelected(date) ? "bg-accent" : ""}
            `}
          >
            {date?.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}