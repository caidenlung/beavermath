import React, { useState, useEffect } from "react";
import { get } from "../../../utilities";

const MeanScore = () => {
  const [meanScore, setMeanScore] = useState(0);

  useEffect(() => {
    getMeanScore();
  }, []);

  const getMeanScore = async () => {
    try {
      const response = await get("/api/scores");
      const scores = response.scores;
      if (scores.length > 0) {
        const sum = scores.reduce((acc, score) => acc + score, 0);
        const mean = sum / scores.length;
        setMeanScore(mean.toFixed(2));
      }
    } catch (err) {
      console.log("Failed to get mean score:", err);
    }
  };

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
      <p className="text-sm font-medium text-zinc-400 mb-1">average score</p>
      <p className="text-2xl font-mono text-emerald-400">{meanScore}</p>
    </div>
  );
};

export default MeanScore;
