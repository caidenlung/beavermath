import React from "react";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "../App";
import NavBar from "../modules/NavBar";

const Home = () => {
  const { userId } = useContext(UserContext);
  const navigate = useNavigate();

  // If not logged in, redirect to login page
  React.useEffect(() => {
    if (!userId) {
      navigate("/");
    }
  }, [userId, navigate]);

  return (
    <div className="min-h-screen text-stone-200 flex items-center justify-center p-4">
      <NavBar />
      <div className="max-w-xl w-full px-4 sm:px-6">
        <div className="text-center space-y-12 sm:space-y-16">
          <div className="space-y-3 sm:space-y-5">
            <h1 className="text-4xl sm:text-6xl font-mono tracking-tight text-orange-400">beavermath</h1>
            <p className="text-stone-400 font-mono text-sm sm:text-base">test your math skills</p>
          </div>

          <div className="flex flex-col gap-3 sm:gap-5">
            <button
              onClick={() => navigate("/play")}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm font-medium text-orange-400 hover:text-orange-300 border border-orange-900/50 hover:border-orange-800 rounded transition-all duration-200"
            >
              start game
            </button>
            <button
              onClick={() => navigate("/duel")}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm font-medium text-stone-300 hover:text-white border border-stone-700 hover:border-stone-600 rounded transition-all duration-200"
            >
              duel
            </button>
            <button
              onClick={() => navigate("/leaderboard")}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 text-sm font-medium text-amber-400/80 hover:text-amber-300 border border-amber-900/30 hover:border-amber-800/50 rounded transition-all duration-200"
            >
              view leaderboard
            </button>
          </div>

          <div className="text-xs text-stone-500 font-mono">
            press tab + enter to quickly start a game
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
