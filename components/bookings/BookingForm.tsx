'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';


// Define the schema for our form
const bookingSchema = z.object({
  check_in_date: z.string().min(1, { message: 'Check-in date is required' }),
  check_out_date: z.string().min(1, { message: 'Check-out date is required' }),
  number_of_guests: z.number().int().positive().min(1, { message: 'At least 1 guest is required' })
}).refine(data => {
  const checkIn = new Date(data.check_in_date);
  const checkOut = new Date(data.check_out_date);
  return checkOut > checkIn;
}, {
  message: 'Check-out date must be after check-in date',
  path: ['check_out_date']
});

export type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  onSubmitSuccess?: () => void;
  onSubmitError?: (error: string) => void;
}

export function BookingForm({ onSubmitSuccess, onSubmitError }: BookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      number_of_guests: 1
    }
  });

  const onSubmit = async (data: BookingFormValues) => {
    setIsLoading(true);

    try {
      // In a real application, you would send this data to your backend
      console.log('Booking data:', data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      reset();
      
      // Call the success callback if provided
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      const errorMessage = 'Failed to submit booking. Please try again.';
      
      // Call the error callback if provided
      if (onSubmitError) {
        onSubmitError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="w-full max-w-4xl mx-auto">

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Check-in Date */}
          <div>
            <label htmlFor="check_in_date" className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="check_in_date"
              className="formfield"
              min={today}
              {...register('check_in_date')}
            />
            {errors.check_in_date && (
              <p className="mt-1 text-sm text-red-600">{errors.check_in_date.message}</p>
            )}
          </div>

          {/* Check-out Date */}
          <div>
            <label htmlFor="check_out_date" className="block text-sm font-medium text-gray-700 mb-1">
              Check-out Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="check_out_date"
              className="formfield"
              min={today}
              {...register('check_out_date')}
            />
            {errors.check_out_date && (
              <p className="mt-1 text-sm text-red-600">{errors.check_out_date.message}</p>
            )}
          </div>

          {/* Number of Guests */}
          <div>
            <label htmlFor="number_of_guests" className="block text-sm font-medium text-gray-700 mb-1">
              Number of Guests <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="number_of_guests"
              className="formfield"
              min="1"
              {...register('number_of_guests', { valueAsNumber: true })}
            />
            {errors.number_of_guests && (
              <p className="mt-1 text-sm text-red-600">{errors.number_of_guests.message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className="button w-full md:w-auto"
          >
            {isLoading ? 'Processing...' : 'Search'}
          </button>
        </div>
      </form>
    </div>
  );
}
