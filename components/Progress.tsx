"use client";

import React, { useEffect, useState } from "react";

type ProgressProps = {
  title?: string;
  currentValue: number;
  targetValue: number;
  threshold1: number; // red -> yellow after this
  threshold2: number; // yellow -> green after this
  threshold1Label?: string;
  threshold2Label?: string;
  label1?: string;
  label2?: string;
  label3?: string;
};

export default function Progress({
  title,
  currentValue,
  targetValue,
  threshold1,
  threshold2,
  label1="",
  label2="",
  label3="",
}: ProgressProps) {
  // Clamp percent to [0, 100]
  const safeTarget = Math.max(targetValue || 0, 1e-8);
  const targetPercent = Math.min(Math.max((currentValue / safeTarget) * 100, 0), 100);
  // Background threshold sections (as percentages of target)
  const t1Percent = Math.min(Math.max((threshold1 / safeTarget) * 100, 0), 100);
  const t2Percent = Math.min(Math.max((threshold2 / safeTarget) * 100, 0), 100);
  // Midpoints for label positioning between ticks
  const mid1 = t1Percent / 2; // between 0% and t1
  const mid2 = (t1Percent + t2Percent) / 2; // between t1 and t2
  const mid3 = (t2Percent + 100) / 2; // between t2 and 100%

  // Animate displayed value from 0 -> currentValue, and derive width/color from it
  const [displayedValue, setDisplayedValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const duration = 5000; // ms
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedValue(currentValue * eased);
      if (t < 1) {
        raf = requestAnimationFrame(animate);
      } else {
        setDisplayedValue(currentValue);
      }
    };

    // reset to 0 first for replays
    setDisplayedValue(0);
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [currentValue, targetValue, threshold1, threshold2]);

  // Filled percent for clipping the multi-colored foreground based on absolute thresholds
  const filledPercent = Math.min(
    Math.max((displayedValue / safeTarget) * 100, 0),
    100
  );

  const formatEUR = (n: number) =>
    new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

  return (
    <div className={`scroll-block-element pb-4 px-8 md:px-32`}>
      {title && <h3 className="mb-2 text-center text-2xl font-bold">AMOUNT PLEDGED</h3>}
      <h3 className="mb-2 text-center text-2xl font-bold">{formatEUR(displayedValue)}</h3>



      {/* Threshold ticks and labels (above bar) */}
      <div className="relative mb-1 mt-6 h-6" aria-hidden>

        {/* Label 1: between 0 and threshold1 */}
        <span
          className="absolute text-md leading-none text-gray-700 whitespace-nowrap bottom-0"
          style={{ left: `${mid1}%`, transform: "translateX(-50%)" }}
        >
          {label1}
        </span>

        {/* Label 2: between threshold1 and threshold2 */}
        <span
          className="absolute text-md leading-none text-gray-700 whitespace-nowrap bottom-0"
          style={{ left: `${mid2}%`, transform: "translateX(-50%)" }}
        >
          {label2}
        </span>
        
        {/* Label 3: between threshold2 and target */}
        <span
          className="absolute text-md leading-none text-gray-700 whitespace-nowrap bottom-0"
          style={{ left: `${mid3}%`, transform: "translateX(-50%)" }}
        >
          {label3}
        </span>
      </div>

      <div
        className="relative h-6 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuenow={Math.round(targetPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Opaque segmented background according to thresholds */}
        <div className="absolute inset-0 flex rounded-full">
          <div className="h-full bg-red-500/20" style={{ width: `${t1Percent}%` }} />
          <div
            className="h-full bg-yellow-500/20"
            style={{ width: `${Math.max(t2Percent - t1Percent, 0)}%` }}
          />
          <div
            className="h-full bg-emerald-500/20"
            style={{ width: `${Math.max(100 - t2Percent, 0)}%` }}
          />
        </div>

        {/* Animated multi-colored foreground clipped to absolute progress (with gradients) */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ clipPath: `inset(0 ${100 - filledPercent}% 0 0)` }}
        >
          <div className="flex h-full w-full rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-red-700 to-red-500"
              style={{ width: `${t1Percent}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300"
              style={{ width: `${Math.max(t2Percent - t1Percent, 0)}%` }}
            />
            <div
              className="h-full bg-gradient-to-r from-emerald-300 to-emerald-500"
              style={{ width: `${Math.max(100 - t2Percent, 0)}%` }}
            />
          </div>
        </div>
      </div>
      <div className="relative mb-1 mt-1 h-6" aria-hidden>
        {/* threshold1 tick */}
        <div
          className="absolute bottom-0 flex flex-col items-center"
          style={{ left: `${t1Percent}%`, transform: "translateX(-50%)" }}
        >
          <div className="text-sm leading-none text-gray-700 whitespace-nowrap mb-0.5">
            {formatEUR(threshold1)}
          </div>
        </div>
        
        {/* threshold2 tick */}
        <div
          className="absolute bottom-0 flex flex-col items-center"
          style={{ left: `${t2Percent}%`, transform: "translateX(-50%)" }}
        >
          <div className="text-sm leading-none text-gray-700 whitespace-nowrap mb-0.5">
            {formatEUR(threshold2)}
          </div>
        </div>

        {/* target tick
        <div
          className="absolute bottom-0 flex flex-col items-center"
          style={{ left: `100%`, transform: "translateX(-50%)" }}
        >
          <div className="text-sm leading-none text-gray-700 whitespace-nowrap mb-0.5">
            {formatEUR(targetValue)}
          </div>
        </div> */}
      </div>
    </div>
  );
}