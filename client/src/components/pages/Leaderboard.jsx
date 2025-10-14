import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "../../utilities";
import { socket } from "../../client-socket";

const Leaderboard = () => {
  const navigate = useNavigate();
  const [scores, setScores] = useState([]);

  useEffect(() => {
    // Initial load of leaderboard
    get("/api/leaderboard").then((scores) => {
      setScores(scores);
    });

    // Listen for real-time updates
    socket.on("leaderboard", (updatedScores) => {
      setScores(updatedScores);
    });

    // Cleanup socket listener when component unmounts
    return () => {
      socket.off("leaderboard");
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center pt-8 sm:pt-16 px-4 sm:px-6">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-amber-400">leaderboard</h1>
          <button
            onClick={() => navigate("/")}
            className="px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-medium text-amber-400/80 hover:text-amber-300 border border-amber-900/50 hover:border-amber-800 rounded transition-all duration-200"
          >
            back
          </button>
        </div>

        <div className="bg-stone-800/50 rounded-lg border border-stone-700">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-700">
            <div className="grid grid-cols-12 text-xs sm:text-sm font-medium text-stone-400">
              <div className="col-span-2 text-center">#</div>
              <div className="col-span-7">player</div>
              <div className="col-span-3 text-right">score</div>
            </div>
          </div>

          <div className="divide-y divide-stone-700/50">
            {scores.map((score, index) => (
              <div key={index} className="px-4 sm:px-6 py-3 sm:py-4">
                <div className="grid grid-cols-12 items-center text-sm">
                  <div className="col-span-2 text-center font-mono text-amber-400">{index + 1}</div>
                  <div className="col-span-7 truncate text-xs sm:text-sm text-stone-300">
                    {score.name}
                  </div>
                  <div className="col-span-3 text-right font-mono text-xs sm:text-sm text-amber-400">
                    {score.score}
                  </div>
                </div>
              </div>
            ))}
            {scores.length === 0 && (
              <div className="px-4 sm:px-6 py-8 text-center text-stone-500">no scores yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
