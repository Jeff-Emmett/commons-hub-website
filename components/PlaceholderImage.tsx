import { ImageIcon } from 'lucide-react';

/**
 * A visible "photo needed" slot. Use anywhere we know a real photograph is
 * coming but hasn't been shot yet — it renders an obvious labelled box so the
 * gap is intentional and reviewable, not a broken image. Swap for a real
 * <Image> (or Directus asset) once the photo exists.
 */
export function PlaceholderImage({
  label,
  className = '',
  aspect = 'aspect-[4/3]',
}: {
  /** What the eventual photo should show, e.g. "Garden in summer, wide". */
  label: string;
  className?: string;
  /** Tailwind aspect-ratio class controlling the slot shape. */
  aspect?: string;
}) {
  return (
    <div
      className={`relative ${aspect} w-full overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-100 ${className}`}
      role="img"
      aria-label={`Placeholder — photo needed: ${label}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <ImageIcon className="h-7 w-7 text-slate-400" aria-hidden />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Photo needed
        </span>
        <span className="text-sm text-slate-500">{label}</span>
      </div>
    </div>
  );
}
