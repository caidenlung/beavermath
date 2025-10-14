import React from "react";

const Scores = ({ score, label = "current score" }) => {
  return (
    <div className="bg-zinc-800/50 rounded-lg px-6 sm:px-10 py-3 sm:py-4 border border-zinc-700 min-w-[120px] sm:min-w-[160px]">
      <p className="text-xs sm:text-sm font-medium text-zinc-400 mb-0.5 sm:mb-1 text-center">{label || "score"}</p>
      <p className="text-xl sm:text-2xl font-mono text-orange-400 text-center">{score}</p>
    </div>
  );
};

export default Scores;
