'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  id?: string;
}

export function TimePicker({ value, onChange, id }: TimePickerProps) {
  const [hour, minute] = value ? value.split(':') : ['', ''];

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${minute || '00'}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${hour || '00'}:${newMinute}`);
  };

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, '0')
  );
  const minutes = ['00', '30'];

  return (
    <div className="flex items-center gap-2" id={id}>
      <Select onValueChange={handleHourChange} value={hour}>
        <SelectTrigger>
          <SelectValue placeholder="시" />
        </SelectTrigger>
        <SelectContent>
          {hours.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>:</span>
      <Select onValueChange={handleMinuteChange} value={minute}>
        <SelectTrigger>
          <SelectValue placeholder="분" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
