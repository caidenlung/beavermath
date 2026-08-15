import React, { useState, useEffect } from "react";
import { get } from "../../../utilities";

/** Optional `scores` prop avoids a duplicate fetch when a parent already loaded them. */
const MeanScore = ({ scores: scoresProp }) => {
  const [meanScore, setMeanScore] = useState(0);

  useEffect(() => {
    const apply = (scores) => {
      if (scores.length > 0) {
        const sum = scores.reduce((acc, score) => acc + score, 0);
        setMeanScore((sum / scores.length).toFixed(2));
      } else {
        setMeanScore(0);
      }
    };

    if (Array.isArray(scoresProp)) {
      apply(scoresProp);
      return;
    }

    get("/api/scores")
      .then((response) => apply(response.scores || []))
      .catch((err) => console.log("Failed to get mean score:", err));
  }, [scoresProp]);

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
      <p className="text-sm font-medium text-zinc-400 mb-1">average score</p>
      <p className="text-2xl font-mono text-emerald-400">{meanScore}</p>
    </div>
  );
};

export default MeanScore;
