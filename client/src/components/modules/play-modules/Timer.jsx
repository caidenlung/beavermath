import React, { useState, useEffect } from "react";

const Timer = ({ onTimeUp, timeLeft: propTimeLeft }) => {
  const [time, setTime] = useState(propTimeLeft || 120);
  const [isActive, setIsActive] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());

  // Initialize timer when propTimeLeft changes
  useEffect(() => {
    if (propTimeLeft !== undefined) {
      setTime(propTimeLeft);
      setIsActive(true);
      setStartTime(Date.now());
    }
  }, [propTimeLeft]);

  // Handle countdown
  useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      const endTime = startTime + (propTimeLeft || 120) * 1000;
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.ceil((endTime - now) / 1000);
        
        if (remaining <= 0) {
          setTime(0);
          setIsActive(false);
          onTimeUp?.();
          clearInterval(interval);
        } else {
          setTime(remaining);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isActive, onTimeUp, startTime, propTimeLeft]);

  return (
    <div className="bg-zinc-800/50 rounded-lg px-6 sm:px-10 py-3 sm:py-4 border border-zinc-700 min-w-[120px] sm:min-w-[160px]">
      <p className="text-xs sm:text-sm font-medium text-zinc-400 mb-0.5 sm:mb-1 text-center">time left</p>
      <p className="text-xl sm:text-2xl font-mono text-yellow-400 text-center">{time}s</p>
    </div>
  );
};

export default Timer;
