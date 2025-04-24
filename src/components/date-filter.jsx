"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

export default function DateRangeFilter({ onFilterChange }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const handleStartDateSelect = (date) => {
    setStartDate(date);
    if (endDate && date > endDate) {
      setEndDate(date);
    }
    updateFilter(date, endDate);
  };

  const handleEndDateSelect = (date) => {
    setEndDate(date);
    updateFilter(startDate, date);
  };

  const updateFilter = (start, end) => {
    onFilterChange({ startDate: start, endDate: end });
  };

  const clearFilters = () => {
    setStartDate(null);
    setEndDate(null);
    onFilterChange({ startDate: null, endDate: null });
  };

  return (
    <div className="flex flex-col w-full">
      <label className="text-sm text-gray-500 mb-1">Filter by date:</label>
      <div className="flex items-center gap-2">
        <div className="grid gap-2 w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal w-full"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <span className="text-gray-500">to</span>

        <div className="grid gap-2 w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="justify-start text-left font-normal w-full"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                disabled={(date) => (startDate ? date < startDate : false)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {(startDate || endDate) && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearFilters}
            className="h-8 w-8"
            title="Clear date filter"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
