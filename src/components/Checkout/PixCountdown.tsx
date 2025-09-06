"use client";

import React, { useState, useEffect } from 'react';

interface PixCountdownProps {
  expiresAt: string;
  onExpire: () => void;
}

export function PixCountdown({ expiresAt, onExpire }: PixCountdownProps) {
  const calculateTimeLeft = () => {
    const difference = +new Date(expiresAt) - +new Date();
    let timeLeft = { minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
      if (newTimeLeft.minutes === 0 && newTimeLeft.seconds === 0) {
        onExpire();
      }
    }, 1000);

    return () => clearTimeout(timer);
  });

  const timerComponents = [];
  if (timeLeft.minutes > 0 || timeLeft.seconds > 0) {
    timerComponents.push(
      <span key="time" className="font-bold text-red-600">
        {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
      </span>
    );
  } else {
    timerComponents.push(<span key="expired" className="font-bold text-red-600">Expirado</span>);
  }

  return (
    <div className="text-center text-gray-600">
      O código expira em: {timerComponents}
    </div>
  );
}