'use client';

import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// ─────────────────────────────────────────────────────────────
// Pricing (source of truth: spec doc)
// ─────────────────────────────────────────────────────────────

const STAY_VAT_RATE = 0.10;
const EVENT_VAT_RATE = 0.20;

interface RoomRate {
  key: 'single' | 'double_twin' | 'double_king' | 'shared';
  label: string;
  nightly_excl_vat: number;   // EUR per person per night (excl. VAT)
  city_tax_per_night: number; // EUR per person per night (city tax, separate)
}

const ROOM_RATES: RoomRate[] = [
  { key: 'single',      label: 'Single Room',                    nightly_excl_vat: 85,    city_tax_per_night: 4.70 },
  { key: 'double_twin', label: 'Double Room (twin beds)',        nightly_excl_vat: 91,    city_tax_per_night: 9.40 },
  { key: 'double_king', label: 'Double Room (kingsize bed)',     nightly_excl_vat: 91,    city_tax_per_night: 9.40 },
  { key: 'shared',      label: 'Shared (4–6 beds)',              nightly_excl_vat: 35.20, city_tax_per_night: 4.70 },
];

interface EventPackage {
  key: 'small' | 'medium' | 'large' | 'xlarge' | 'call';
  label: string;
  capacity: string;
  day_rate_excl_vat: number; // 0 for "let's have a call"
}

const EVENT_PACKAGES: EventPackage[] = [
  { key: 'small',  label: 'Small',                  capacity: 'up to 20 guests',  day_rate_excl_vat: 200 },
  { key: 'medium', label: 'Medium',                 capacity: 'up to 30 guests',  day_rate_excl_vat: 500 },
  { key: 'large',  label: 'Large',                  capacity: 'up to 65 guests',  day_rate_excl_vat: 700 },
  { key: 'xlarge', label: 'Extra Large',            capacity: 'up to 100 guests', day_rate_excl_vat: 1000 },
  { key: 'call',   label: "I don't know yet — let's have a call", capacity: '',  day_rate_excl_vat: 0 },
];

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────

const baseSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  check_in: z.string().min(1, 'Check-in date is required'),
  check_out: z.string().min(1, 'Check-out date is required'),
  message: z.string().optional(),
});

const stayFormSchema = baseSchema.extend({
  guests: z.number().int().min(1, 'At least 1 guest is required'),
  room_type: z.enum(['single', 'double_twin', 'double_king', 'shared']).optional(),
}).refine((d) => new Date(d.check_out) > new Date(d.check_in), {
  message: 'Check-out must be after check-in',
  path: ['check_out'],
});

const eventFormSchema = baseSchema.extend({
  event_size_package: z.enum(['small', 'medium', 'large', 'xlarge', 'call']),
  event_title: z.string().optional(),
  event_description: z.string().optional(),
}).refine((d) => new Date(d.check_out) > new Date(d.check_in), {
  message: 'End date must be after start date',
  path: ['check_out'],
});

type StayValues = z.infer<typeof stayFormSchema>;
type EventValues = z.infer<typeof eventFormSchema>;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface BookingFormProps {
  variant: 'stay' | 'event';
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms) || ms <= 0) return 0;
  return Math.round(ms / 86_400_000);
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function BookingForm({ variant }: BookingFormProps) {
  return variant === 'stay' ? <StayForm /> : <EventForm />;
}

// ── Stay variant ─────────────────────────────────────────────

function StayForm() {
  const today = new Date().toISOString().split('T')[0];
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StayValues>({
    resolver: zodResolver(stayFormSchema),
    defaultValues: { guests: 1, room_type: 'single' },
  });

  const watched = useWatch({ control });
  const nights = nightsBetween(watched.check_in || '', watched.check_out || '');
  const guests = Number(watched.guests) || 0;
  const rate = ROOM_RATES.find((r) => r.key === watched.room_type) ?? ROOM_RATES[0];
  const lodgingExclVat = rate.nightly_excl_vat * guests * nights;
  const vat = lodgingExclVat * STAY_VAT_RATE;
  const cityTax = rate.city_tax_per_night * guests * nights;
  const total = lodgingExclVat + vat + cityTax;

  const onSubmit = async (data: StayValues) => {
    setSubmitState('sending');
    setSubmitError(null);
    try {
      const res = await fetch('/api/booking-inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          inquiry_type: 'stay',
          ...data,
          estimated_total_eur: Number(total.toFixed(2)),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to send inquiry');
      }
      setSubmitState('ok');
      reset({ guests: 1, room_type: 'single' });
    } catch (err) {
      setSubmitState('error');
      setSubmitError(err instanceof Error ? err.message : 'Failed to send inquiry');
    }
  };

  if (submitState === 'ok') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-2">Thanks — we received your inquiry.</h3>
        <p className="text-green-800">
          Our team will be in touch shortly. If urgent, email{' '}
          <a className="underline" href="mailto:office@commons-hub.at">office@commons-hub.at</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldText label="Your name *" error={errors.name?.message} {...register('name')} />
        <FieldText label="Email *" type="email" error={errors.email?.message} {...register('email')} />
        <FieldText label="Check-in *" type="date" min={today} error={errors.check_in?.message} {...register('check_in')} />
        <FieldText label="Check-out *" type="date" min={today} error={errors.check_out?.message} {...register('check_out')} />
        <FieldText
          label="Number of guests *"
          type="number"
          min={1}
          error={errors.guests?.message}
          {...register('guests', { valueAsNumber: true })}
        />
        <FieldSelect label="Room type" error={errors.room_type?.message} {...register('room_type')}>
          {ROOM_RATES.map((r) => (
            <option key={r.key} value={r.key}>
              {r.label} — {formatEur(r.nightly_excl_vat)}/night + {formatEur(r.city_tax_per_night)} tax
            </option>
          ))}
        </FieldSelect>
      </div>

      <FieldTextarea label="Anything we should know?" {...register('message')} />

      <PriceSummary
        rows={[
          { label: `${formatEur(rate.nightly_excl_vat)} × ${guests} guest(s) × ${nights} night(s)`, amount: lodgingExclVat },
          { label: 'VAT (10%)', amount: vat },
          { label: `City tax (${formatEur(rate.city_tax_per_night)} × ${guests} × ${nights})`, amount: cityTax },
        ]}
        total={total}
      />

      {submitState === 'error' && (
        <p className="text-red-600 text-sm" role="alert">{submitError}</p>
      )}

      <div className="flex justify-center mt-8">
        <button type="submit" disabled={isSubmitting} className="button w-full md:w-auto">
          {isSubmitting ? 'Sending…' : 'Send inquiry'}
        </button>
      </div>
    </form>
  );
}

// ── Event variant ────────────────────────────────────────────

function EventForm() {
  const today = new Date().toISOString().split('T')[0];
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EventValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: { event_size_package: 'medium' },
  });

  const watched = useWatch({ control });
  const days = Math.max(1, nightsBetween(watched.check_in || '', watched.check_out || ''));
  const pkg = EVENT_PACKAGES.find((p) => p.key === watched.event_size_package) ?? EVENT_PACKAGES[0];
  const venueExclVat = pkg.day_rate_excl_vat * days;
  const vat = venueExclVat * EVENT_VAT_RATE;
  const total = venueExclVat + vat;
  const isCallVariant = pkg.key === 'call';

  const onSubmit = async (data: EventValues) => {
    setSubmitState('sending');
    setSubmitError(null);
    try {
      const res = await fetch('/api/booking-inquiries', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          inquiry_type: 'event',
          ...data,
          estimated_total_eur: isCallVariant ? undefined : Number(total.toFixed(2)),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to send inquiry');
      }
      setSubmitState('ok');
      reset({ event_size_package: 'medium' });
    } catch (err) {
      setSubmitState('error');
      setSubmitError(err instanceof Error ? err.message : 'Failed to send inquiry');
    }
  };

  if (submitState === 'ok') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h3 className="font-semibold text-green-900 mb-2">Thanks — we received your inquiry.</h3>
        <p className="text-green-800">
          We&apos;ll get back to you soon to scope the event. For urgent questions, email{' '}
          <a className="underline" href="mailto:office@commons-hub.at">office@commons-hub.at</a>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldText label="Your name *" error={errors.name?.message} {...register('name')} />
        <FieldText label="Email *" type="email" error={errors.email?.message} {...register('email')} />
        <FieldText label="Start date *" type="date" min={today} error={errors.check_in?.message} {...register('check_in')} />
        <FieldText label="End date *" type="date" min={today} error={errors.check_out?.message} {...register('check_out')} />
        <FieldSelect
          label="Event size *"
          error={errors.event_size_package?.message}
          {...register('event_size_package')}
        >
          {EVENT_PACKAGES.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
              {p.day_rate_excl_vat > 0 ? ` — ${formatEur(p.day_rate_excl_vat)}/day, ${p.capacity}` : ''}
            </option>
          ))}
        </FieldSelect>
        <FieldText label="Event title (optional)" {...register('event_title')} />
      </div>

      <FieldTextarea
        label="Tell us about the event"
        placeholder="Tone, audience, programme, anything we should know..."
        {...register('event_description')}
      />

      {!isCallVariant && (
        <PriceSummary
          rows={[
            { label: `${pkg.label} package — ${formatEur(pkg.day_rate_excl_vat)} × ${days} day(s)`, amount: venueExclVat },
            { label: 'VAT (20%)', amount: vat },
          ]}
          total={total}
        />
      )}

      {isCallVariant && (
        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">
          No need to estimate now — we&apos;ll figure out the right setup on a call.
        </div>
      )}

      {submitState === 'error' && (
        <p className="text-red-600 text-sm" role="alert">{submitError}</p>
      )}

      <div className="flex justify-center mt-8">
        <button type="submit" disabled={isSubmitting} className="button w-full md:w-auto">
          {isSubmitting ? 'Sending…' : 'Send inquiry'}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────
// Field primitives
// ─────────────────────────────────────────────────────────────

interface FieldTextProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FieldText = React.forwardRef<HTMLInputElement, FieldTextProps>(
  function FieldText({ label, error, ...rest }, ref) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input ref={ref} className="formfield" {...rest} />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

interface FieldSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const FieldSelect = React.forwardRef<HTMLSelectElement, FieldSelectProps>(
  function FieldSelect({ label, error, children, ...rest }, ref) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select ref={ref} className="formfield" {...rest}>
          {children}
        </select>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  },
);

interface FieldTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

const FieldTextarea = React.forwardRef<HTMLTextAreaElement, FieldTextareaProps>(
  function FieldTextarea({ label, ...rest }, ref) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea ref={ref} rows={4} className="formfield" {...rest} />
      </div>
    );
  },
);

// ─────────────────────────────────────────────────────────────
// Price summary
// ─────────────────────────────────────────────────────────────

interface PriceRow {
  label: string;
  amount: number;
}

function PriceSummary({ rows, total }: { rows: PriceRow[]; total: number }) {
  if (total <= 0) return null;
  return (
    <div className="bg-slate-50 rounded-lg p-4 text-sm">
      <ul className="space-y-1">
        {rows.map((row, i) => (
          <li key={i} className="flex justify-between">
            <span className="text-slate-600">{row.label}</span>
            <span className="text-slate-900 tabular-nums">{formatEur(row.amount)}</span>
          </li>
        ))}
        <li className="flex justify-between pt-2 border-t border-slate-200 font-semibold">
          <span>Estimated total</span>
          <span className="tabular-nums">{formatEur(total)}</span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-slate-500">Final invoice may vary — this is a guide.</p>
    </div>
  );
}
