"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, X } from "lucide-react"

export default function DateRangeFilter({ onFilterChange }) {
  const [startDate, setStartDate] = useState(null)
  const [endDate, setEndDate] = useState(null)

  const handleStartDateSelect = (date) => {
    setStartDate(date)
    if (endDate && date > endDate) {
      setEndDate(date)
    }
    updateFilter(date, endDate)
  }

  const handleEndDateSelect = (date) => {
    setEndDate(date)
    updateFilter(startDate, date)
  }

  const updateFilter = (start, end) => {
    onFilterChange({ startDate: start, endDate: end })
  }

  const clearFilters = () => {
    setStartDate(null)
    setEndDate(null)
    onFilterChange({ startDate: null, endDate: null })
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center mb-4">
      <div className="flex items-center">
        <span className="mr-2 text-sm font-medium">Filter by date:</span>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "PPP") : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={startDate} onSelect={handleStartDateSelect} initialFocus />
          </PopoverContent>
        </Popover>

        <span className="text-sm">to</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "PPP") : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateSelect}
              disabled={(date) => (startDate ? date < startDate : false)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {(startDate || endDate) && (
          <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9">
            <X className="h-4 w-4" />
            <span className="sr-only">Clear date filter</span>
          </Button>
        )}
      </div>
    </div>
  )
}

