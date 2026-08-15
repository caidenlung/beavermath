import React, { useState, useEffect } from "react";
import { get } from "../../../utilities";

/** Optional `scores` prop avoids a duplicate fetch when a parent already loaded them. */
const GamesPlayed = ({ scores: scoresProp }) => {
  const [gamesPlayed, setGamesPlayed] = useState(0);

  useEffect(() => {
    if (Array.isArray(scoresProp)) {
      setGamesPlayed(scoresProp.length);
      return;
    }

    get("/api/scores")
      .then((response) => setGamesPlayed((response.scores || []).length))
      .catch((err) => console.log("Failed to get games played:", err));
  }, [scoresProp]);

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
      <p className="text-sm font-medium text-zinc-400 mb-1">games played</p>
      <p className="text-2xl font-mono text-yellow-400">{gamesPlayed}</p>
    </div>
  );
};

export default GamesPlayed;
