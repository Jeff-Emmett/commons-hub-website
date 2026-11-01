'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';

// ─────────────────────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────────────────────

// Labels and prices come from Directus (Settings → Booking prices), passed in
// by the page as `rooms` / `packages`. The constants below are the built-in
// set, used only when that list is unavailable. The option keys are fixed: the
// inquiry API validates them (app/api/booking-inquiries/route.ts), which is why
// editors can change a label or price but not add or remove an option.
// Listed prices are VAT-inclusive (stay 10%, event 20%) — see PriceSummary notes.

interface RoomRate {
  key: 'single' | 'double_twin' | 'double_king' | 'shared';
  label: string;
  nightly_excl_vat: number;   // EUR per person per night (excl. VAT)
  city_tax_per_night: number; // EUR per person per night (city tax, separate)
}

const ROOM_RATES: RoomRate[] = [
  { key: 'single',      label: 'Single Room',                    nightly_excl_vat: 85,    city_tax_per_night: 4.70 },
  { key: 'double_twin', label: 'Double Room (twin beds)',        nightly_excl_vat: 45.50, city_tax_per_night: 4.70 },
  { key: 'double_king', label: 'Double Room (kingsize bed)',     nightly_excl_vat: 45.50, city_tax_per_night: 4.70 },
  { key: 'shared',      label: 'Shared (4–6 beds)',              nightly_excl_vat: 35.20, city_tax_per_night: 4.70 },
];

const DOUBLE_ROOM_KEYS = new Set(['double_twin', 'double_king']);

interface EventPackage {
  key: 'small' | 'medium' | 'large' | 'xlarge' | 'call';
  label: string;
  includes: string;  // spaces included in the package
  capacity: string;
  day_rate_excl_vat: number; // 0 for "let's have a call"
}

const EVENT_PACKAGES: EventPackage[] = [
  { key: 'small',  label: 'Small',       includes: 'Seminar Room + Common Areas',                              capacity: 'max. 20 guests',  day_rate_excl_vat: 200 },
  { key: 'medium', label: 'Mid',         includes: 'Seminar Room, Conference Hall + Common Areas',             capacity: 'max. 30 guests',  day_rate_excl_vat: 500 },
  { key: 'large',  label: 'Big',         includes: 'Seminar Room, Conference Hall, Maker Hall + Common Areas', capacity: 'max. 65 guests',  day_rate_excl_vat: 700 },
  { key: 'xlarge', label: 'Extra Big',   includes: 'Everything above',                                         capacity: 'max. 100 guests', day_rate_excl_vat: 1000 },
  { key: 'call',   label: "I don't know yet", includes: "Tell us your plan and we'll find the right fit",     capacity: '',                day_rate_excl_vat: 0 },
];

// ─────────────────────────────────────────────────────────────
// Schemas
// ─────────────────────────────────────────────────────────────

type T = ReturnType<typeof useTranslations>;

function schemas(t: T) {
  const baseSchema = z.object({
    name: z.string().trim().min(1, t('errors.name')),
    email: z.string().trim().email(t('errors.email')),
    check_in: z.string().min(1, t('errors.checkIn')),
    check_out: z.string().min(1, t('errors.checkOut')),
    message: z.string().optional(),
  });

  const stayFormSchema = baseSchema.extend({
    guests: z.number().int().min(1, t('errors.guests')),
    room_type: z.enum(['single', 'double_twin', 'double_king', 'shared']).optional(),
  }).refine((d) => new Date(d.check_out) > new Date(d.check_in), {
    message: t('errors.checkOutAfter'),
    path: ['check_out'],
  });

  const eventFormSchema = baseSchema.extend({
    event_size_package: z.enum(['small', 'medium', 'large', 'xlarge', 'call']),
    event_description: z.string().optional(),
  }).refine((d) => new Date(d.check_out) > new Date(d.check_in), {
    message: t('errors.endAfter'),
    path: ['check_out'],
  });

  return { stayFormSchema, eventFormSchema };
}

type StayValues = z.infer<ReturnType<typeof schemas>['stayFormSchema']>;
type EventValues = z.infer<ReturnType<typeof schemas>['eventFormSchema']>;

/** A Directus booking_options row (see getBookingOptions in lib/cms/content.ts). */
export interface BookingOptionInput {
  option_key: string;
  label: string;
  includes: string;
  capacity: string;
  price_excl_vat: number;
  city_tax_per_night: number;
}

function roomRatesFrom(rows?: BookingOptionInput[]): RoomRate[] {
  const known = rows?.filter((r) => ROOM_RATES.some((d) => d.key === r.option_key));
  if (!known?.length) return ROOM_RATES;
  return known.map((r) => ({
    key: r.option_key as RoomRate['key'],
    label: r.label,
    nightly_excl_vat: r.price_excl_vat,
    city_tax_per_night: r.city_tax_per_night,
  }));
}

function packagesFrom(rows?: BookingOptionInput[]): EventPackage[] {
  const known = rows?.filter((r) => EVENT_PACKAGES.some((d) => d.key === r.option_key));
  if (!known?.length) return EVENT_PACKAGES;
  return known.map((r) => ({
    key: r.option_key as EventPackage['key'],
    label: r.label,
    includes: r.includes,
    capacity: r.capacity,
    day_rate_excl_vat: r.price_excl_vat,
  }));
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

interface BookingFormProps {
  variant: 'stay' | 'event';
  /** Room options from Directus (stay variant). */
  rooms?: BookingOptionInput[];
  /** Event packages from Directus (event variant). */
  packages?: BookingOptionInput[];
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

export function BookingForm({ variant, rooms, packages }: BookingFormProps) {
  return variant === 'stay' ? (
    <StayForm roomRates={roomRatesFrom(rooms)} />
  ) : (
    <EventForm eventPackages={packagesFrom(packages)} />
  );
}

// ── Stay variant ─────────────────────────────────────────────

function StayForm({ roomRates }: { roomRates: RoomRate[] }) {
  const t = useTranslations('booking');
  const { stayFormSchema } = schemas(t);
  const today = new Date().toISOString().split('T')[0];
  const [submitState, setSubmitState] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<StayValues>({
    resolver: zodResolver(stayFormSchema),
    defaultValues: { guests: 1, room_type: 'single' },
  });

  const watched = useWatch({ control });

  // Double rooms are sold per pair: snap guests -> 2 when the user picks
  // (or switches into) a double-bed option. Field stays editable so a
  // couple bringing a cot/baby can override.
  const prevRoomTypeRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const rt = watched.room_type;
    if (
      rt &&
      rt !== prevRoomTypeRef.current &&
      DOUBLE_ROOM_KEYS.has(rt)
    ) {
      setValue('guests', 2, { shouldValidate: true });
    }
    prevRoomTypeRef.current = rt;
  }, [watched.room_type, setValue]);

  const nights = nightsBetween(watched.check_in || '', watched.check_out || '');
  const guests = Number(watched.guests) || 0;
  const rate = roomRates.find((r) => r.key === watched.room_type) ?? roomRates[0];
  // Listed room price already includes 10% VAT. City tax is added on top
  // (it is part of the total, just itemised — never a separate add-on note).
  const lodging = rate.nightly_excl_vat * guests * nights;
  const cityTax = rate.city_tax_per_night * guests * nights;
  const total = lodging + cityTax;

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
        throw new Error(body.error ?? t('failed'));
      }
      setSubmitState('ok');
      reset({ guests: 1, room_type: 'single' });
    } catch (err) {
      setSubmitState('error');
      setSubmitError(err instanceof Error ? err.message : t('failed'));
    }
  };

  if (submitState === 'ok') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <p className="text-green-900 text-lg">{t('thanks')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Field order per spec: guests + accommodation type, then dates, then name + email. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FieldText
              label={`${t('numberOfGuests')} *`}
              type="number"
              min={1}
              error={errors.guests?.message}
              {...register('guests', { valueAsNumber: true })}
            />
            <FieldSelect label={t('roomType')} error={errors.room_type?.message} {...register('room_type')}>
              {roomRates.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label} ({t('roomPrice', { price: formatEur(r.nightly_excl_vat), tax: formatEur(r.city_tax_per_night) })})
                </option>
              ))}
            </FieldSelect>
            <FieldText label={`${t('checkIn')} *`} type="date" min={today} error={errors.check_in?.message} {...register('check_in')} />
            <FieldText label={`${t('checkOut')} *`} type="date" min={today} error={errors.check_out?.message} {...register('check_out')} />
            <FieldText label={`${t('yourName')} *`} error={errors.name?.message} {...register('name')} />
            <FieldText label={`${t('email')} *`} type="email" error={errors.email?.message} {...register('email')} />
          </div>

          <FieldTextarea label={t('notes')} {...register('message')} />

          {submitState === 'error' && (
            <p className="text-red-600 text-sm" role="alert">{submitError}</p>
          )}

          <div className="flex justify-start">
            <button type="submit" disabled={isSubmitting} className="button w-full sm:w-auto">
              {isSubmitting ? t('sending') : t('submit')}
            </button>
          </div>
        </div>
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24">
            <PriceSummary
              rows={[
                { label: t('rowLodging', { price: formatEur(rate.nightly_excl_vat), guests, nights }), amount: lodging },
                { label: t('rowCityTax', { tax: formatEur(rate.city_tax_per_night), guests, nights }), amount: cityTax },
              ]}
              total={total}
              totalLabel={t('estimatedTotal')}
              note={t('vatStay')}
            />
          </div>
        </aside>
      </div>
    </form>
  );
}

// ── Event variant ────────────────────────────────────────────

function EventForm({ eventPackages }: { eventPackages: EventPackage[] }) {
  const t = useTranslations('booking');
  const { eventFormSchema } = schemas(t);
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
  const pkg = eventPackages.find((p) => p.key === watched.event_size_package) ?? eventPackages[0];
  // Package day-rate already includes 20% VAT — never added on top.
  const venue = pkg.day_rate_excl_vat * days;
  const total = venue;
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
        throw new Error(body.error ?? t('failed'));
      }
      setSubmitState('ok');
      reset({ event_size_package: 'medium' });
    } catch (err) {
      setSubmitState('error');
      setSubmitError(err instanceof Error ? err.message : t('failed'));
    }
  };

  if (submitState === 'ok') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <p className="text-green-900 text-lg">{t('thanks')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-6 rounded-lg shadow-md">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Field order per spec: pick a package, then dates, then contact, then message. */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-3">{t('choosePackage')} *</legend>
            <div className="space-y-3">
              {eventPackages.map((p) => (
                <label
                  key={p.key}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-400 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-50"
                >
                  <input
                    type="radio"
                    value={p.key}
                    className="mt-1 h-4 w-4 shrink-0 accent-slate-900"
                    {...register('event_size_package')}
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-semibold text-slate-900">{p.label}</span>
                      {p.day_rate_excl_vat > 0 && (
                        <span className="text-sm text-slate-600">
                          {t('perDay', { price: formatEur(p.day_rate_excl_vat) })} · {p.capacity}
                        </span>
                      )}
                    </span>
                    <span className="block text-sm text-slate-600">{p.includes}</span>
                  </span>
                </label>
              ))}
            </div>
            {errors.event_size_package?.message && (
              <p className="mt-1 text-sm text-red-600">{errors.event_size_package.message}</p>
            )}
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <FieldText label={`${t('startDate')} *`} type="date" min={today} error={errors.check_in?.message} {...register('check_in')} />
            <FieldText label={`${t('endDate')} *`} type="date" min={today} error={errors.check_out?.message} {...register('check_out')} />
            <FieldText label={`${t('yourName')} *`} error={errors.name?.message} {...register('name')} />
            <FieldText label={`${t('email')} *`} type="email" error={errors.email?.message} {...register('email')} />
          </div>

          <FieldTextarea
            label={t('notesOptional')}
            placeholder={t('notesPlaceholder')}
            {...register('event_description')}
          />

          {submitState === 'error' && (
            <p className="text-red-600 text-sm" role="alert">{submitError}</p>
          )}

          <div className="flex justify-start">
            <button type="submit" disabled={isSubmitting} className="button w-full sm:w-auto">
              {isSubmitting ? t('sending') : t('submit')}
            </button>
          </div>
        </div>
        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 space-y-4">
            {!isCallVariant && (
              <PriceSummary
                rows={[
                  { label: t('rowPackage', { label: pkg.label, price: formatEur(pkg.day_rate_excl_vat), days }), amount: venue },
                ]}
                total={total}
                totalLabel={t('estimatedTotal')}
                note={t('vatEvent')}
              />
            )}
            {isCallVariant && (
              <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700">{t('callNote')}</div>
            )}
          </div>
        </aside>
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
  function FieldText({ label, error, id, ...rest }, ref) {
    const reactId = React.useId();
    const fieldId = id ?? rest.name ?? reactId;
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input ref={ref} id={fieldId} className="formfield" {...rest} />
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
  function FieldSelect({ label, error, children, id, ...rest }, ref) {
    const reactId = React.useId();
    const fieldId = id ?? rest.name ?? reactId;
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select ref={ref} id={fieldId} className="formfield" {...rest}>
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
  function FieldTextarea({ label, id, ...rest }, ref) {
    const reactId = React.useId();
    const fieldId = id ?? rest.name ?? reactId;
    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea ref={ref} id={fieldId} rows={4} className="formfield" {...rest} />
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

function PriceSummary({
  rows,
  total,
  totalLabel,
  note,
}: {
  rows: PriceRow[];
  total: number;
  totalLabel: string;
  note?: string;
}) {
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
          <span>{totalLabel}</span>
          <span className="tabular-nums">{formatEur(total)}</span>
        </li>
      </ul>
      {note && <p className="mt-3 text-xs text-slate-500">{note}</p>}
    </div>
  );
}
