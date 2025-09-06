"use client";

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  initialMinutes: number;
  initialSeconds: number;
}

const TimeBox = ({ value, label }: { value: string; label: string }) => (
  <div className="flex flex-col items-center">
    <div className="bg-red-600 text-white w-20 h-20 rounded-lg flex items-center justify-center text-4xl font-bold shadow-md">
      {value}
    </div>
    <span className="text-red-700 mt-2 text-sm font-medium">{label}</span>
  </div>
);

export function CountdownTimer({ initialMinutes, initialSeconds }: CountdownTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialMinutes * 60 + initialSeconds);

  useEffect(() => {
    if (totalSeconds <= 0) return;

    const timer = setInterval(() => {
      setTotalSeconds(prevSeconds => (prevSeconds > 0 ? prevSeconds - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [totalSeconds]);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="bg-red-100 border-2 border-red-200 rounded-xl p-6 inline-flex flex-col items-center gap-4">
      <h3 className="text-red-700 font-semibold text-lg">A promoção vai acabar em:</h3>
      <div className="flex items-center gap-4">
        <TimeBox value={String(minutes).padStart(2, '0')} label="Minutos" />
        <span className="text-red-600 text-4xl font-bold">:</span>
        <TimeBox value={String(seconds).padStart(2, '0')} label="Segundos" />
      </div>
    </div>
  );
}