import React, { useState, useEffect } from "react";
import { get } from "../../../utilities";

const HighScore = () => {
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    getHighScore();
  }, []);

  const getHighScore = async () => {
    try {
      const response = await get("/api/scores");
      const scores = response.scores || [];
      let maxScore = response.highScore || 0;
      for (const s of scores) {
        if (s > maxScore) maxScore = s;
      }
      setHighScore(maxScore);
    } catch (err) {
      console.log("Failed to get high score:", err);
    }
  };

  return (
    <div className="bg-stone-800/50 rounded-lg p-6 border border-stone-700">
      <p className="text-sm text-stone-400 mb-2">highest score</p>
      <p className="text-4xl font-mono text-orange-400">{highScore}</p>
    </div>
  );
};

export default HighScore;
