import React, { useState, useEffect, useRef } from "react";

const Timer = ({ onTimeUp, timeLeft: propTimeLeft, controlled = false }) => {
  const [time, setTime] = useState(propTimeLeft || 120);
  const onTimeUpRef = useRef(onTimeUp);
  const startedAtRef = useRef(Date.now());
  const durationRef = useRef(propTimeLeft || 120);
  const finishedRef = useRef(false);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Controlled mode (duel): parent owns the countdown; just display the prop
  useEffect(() => {
    if (controlled) {
      setTime(propTimeLeft ?? 0);
    }
  }, [controlled, propTimeLeft]);

  // Uncontrolled mode (solo): count down once from the initial duration
  useEffect(() => {
    if (controlled) return;

    finishedRef.current = false;
    durationRef.current = propTimeLeft || 120;
    startedAtRef.current = Date.now();
    setTime(durationRef.current);

    const interval = setInterval(() => {
      const remaining = Math.ceil(
        (startedAtRef.current + durationRef.current * 1000 - Date.now()) / 1000
      );

      if (remaining <= 0) {
        setTime(0);
        clearInterval(interval);
        if (!finishedRef.current) {
          finishedRef.current = true;
          onTimeUpRef.current?.();
        }
      } else {
        setTime(remaining);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [controlled, propTimeLeft]);

  return (
    <div className="bg-zinc-800/50 rounded-lg px-6 sm:px-10 py-3 sm:py-4 border border-zinc-700 min-w-[120px] sm:min-w-[160px]">
      <p className="text-xs sm:text-sm font-medium text-zinc-400 mb-0.5 sm:mb-1 text-center">
        time left
      </p>
      <p className="text-xl sm:text-2xl font-mono text-yellow-400 text-center">{time}s</p>
    </div>
  );
};

export default Timer;
