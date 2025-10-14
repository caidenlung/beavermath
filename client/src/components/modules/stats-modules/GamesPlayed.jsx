import React, { useState, useEffect } from "react";
import { get } from "../../../utilities";

const GamesPlayed = () => {
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    const getGamesPlayed = async () => {
      try {
        const response = await get("/api/scores");
        const scores = response.scores;
        setGamesPlayed(scores.length);
      } catch (err) {
        console.log("Failed to get games played:", err);
      }
    };
    getGamesPlayed();
  }, []);

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
      <p className="text-sm font-medium text-zinc-400 mb-1">games played</p>
      <p className="text-2xl font-mono text-yellow-400">{gamesPlayed}</p>
    </div>
  );
};

export default GamesPlayed;
