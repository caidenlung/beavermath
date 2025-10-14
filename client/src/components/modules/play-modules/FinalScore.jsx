import React from "react";
import { useNavigate } from "react-router-dom";
import { post } from "../../../utilities";

const FinalScore = ({ score }) => {
  const navigate = useNavigate();

  React.useEffect(() => {
    post("/api/score", { score: score }).then(() => console.log("score saved successfully"));
  }, [score]);

  const handlePlayAgain = () => {
    window.location.reload();
  };

  const handleHome = () => {
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8 sm:space-y-12 py-12 sm:py-24">
      <div className="bg-zinc-800/50 rounded-lg p-6 sm:p-8 border border-zinc-700 text-center">
        <p className="text-xs sm:text-sm font-medium text-zinc-400 mb-2 sm:mb-3">final score</p>
        <p className="text-4xl sm:text-6xl font-mono text-orange-400 mb-4 sm:mb-6">{score}</p>
        <div className="text-xs sm:text-sm text-zinc-400 font-mono">score saved</div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
        <button
          onClick={handlePlayAgain}
          className="px-6 sm:px-8 py-3 sm:py-4 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-all duration-200"
        >
          play again
        </button>
        <button
          onClick={handleHome}
          className="px-6 sm:px-8 py-3 sm:py-4 text-sm font-medium text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded transition-all duration-200"
        >
          back to home
        </button>
      </div>
    </div>
  );
};

export default FinalScore;
