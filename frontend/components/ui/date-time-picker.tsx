'use client';

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/vm/utils/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TimePicker } from './time-picker';

interface DateTimePickerProps {
  value: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  id?: string;
}

// Helper function to format a Date object into "YYYY-MM-DDTHH:mm" in local time
function toLocalISOString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function DateTimePicker({ value, onChange, id }: DateTimePickerProps) {
  const date = value ? new Date(value) : new Date();
  const time = value ? format(new Date(value), 'HH:mm') : '00:00';

  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;
    const [hours, minutes] = time.split(':');
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    onChange(toLocalISOString(newDate));
  };

  const handleTimeChange = (newTime: string) => {
    const newDate = new Date(date);
    const [hours, minutes] = newTime.split(':');
    newDate.setHours(parseInt(hours, 10));
    newDate.setMinutes(parseInt(minutes, 10));
    onChange(toLocalISOString(newDate));
  };

  return (
    <div className="flex flex-col gap-2" id={id}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>날짜 선택</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <TimePicker value={time} onChange={handleTimeChange} />
    </div>
  );
}
