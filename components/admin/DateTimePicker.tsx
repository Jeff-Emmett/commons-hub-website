'use client';

import { useState, useEffect } from 'react';

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id?: string;
  name?: string;
}

export default function DateTimePicker({
  value,
  onChange,
  required = false,
  id,
  name,
}: DateTimePickerProps) {
  // Parse the initial value into date and time components
  const [dateValue, setDateValue] = useState('');
  const [timeValue, setTimeValue] = useState('12:00'); // Default to noon to avoid empty time

  // Initialize the date and time values from the input value
  useEffect(() => {
    if (value) {
      try {
        // Try to parse the value as a date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          // Format the date as YYYY-MM-DD
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          setDateValue(`${year}-${month}-${day}`);

          // Format the time as HH:MM
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          setTimeValue(`${hours}:${minutes}`);
        } else {
          // If it's not a valid date, try to parse it as a string
          const parts = value.split(' ');
          if (parts.length >= 2) {
            setDateValue(parts[0]);
            setTimeValue(parts[1].split(':').slice(0, 2).join(':'));
          }
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    } else {
      // If no value is provided, set a default time but leave date empty
      setTimeValue('12:00');
    }
  }, [value]);

  // Combine date and time values and call onChange
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setDateValue(newDate);
    updateCombinedValue(newDate, timeValue);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value || '12:00'; // Ensure we always have a time value
    setTimeValue(newTime);
    updateCombinedValue(dateValue, newTime);
  };

  const updateCombinedValue = (date: string, time: string) => {
    // Only update if we have both date and time to avoid timestamp errors
    if (date && time) {
      // Combine date and time into a single string
      const combinedValue = `${date} ${time}:00`;
      onChange(combinedValue);
    } else if (date) {
      // If we only have date, add a default time
      onChange(`${date} 12:00:00`);
    } else {
      // Clear the value if no date is provided
      onChange('');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <div className="flex-1">
        <input
          type="date"
          id={`${id || name}-date`}
          name={`${name}-date`}
          value={dateValue}
          onChange={handleDateChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={required}
          autoComplete="off"
        />
      </div>
      <div className="flex-1">
        <input
          type="time"
          id={`${id || name}-time`}
          name={`${name}-time`}
          value={timeValue}
          onChange={handleTimeChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required={required}
          autoComplete="off"
        />
      </div>
    </div>
  );
}
