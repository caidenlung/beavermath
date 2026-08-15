import React, { useState, useEffect } from "react";
import { get } from "../../../utilities";

/** Optional `scores` prop avoids a duplicate fetch when a parent already loaded them. */
const HighScore = ({ scores: scoresProp }) => {
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    if (Array.isArray(scoresProp)) {
      let maxScore = 0;
      for (const s of scoresProp) {
        if (s > maxScore) maxScore = s;
      }
      setHighScore(maxScore);
      return;
    }

    get("/api/scores")
      .then((response) => {
        const scores = response.scores || [];
        let maxScore = response.highScore || 0;
        for (const s of scores) {
          if (s > maxScore) maxScore = s;
        }
        setHighScore(maxScore);
      })
      .catch((err) => console.log("Failed to get high score:", err));
  }, [scoresProp]);

  return (
    <div className="bg-stone-800/50 rounded-lg p-6 border border-stone-700">
      <p className="text-sm text-stone-400 mb-2">highest score</p>
      <p className="text-4xl font-mono text-orange-400">{highScore}</p>
    </div>
  );
};

export default HighScore;
