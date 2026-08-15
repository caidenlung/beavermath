import React, { useContext, useEffect, useState } from "react";
import Graph from "../modules/stats-modules/Graph";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../App";
import { get } from "../../utilities";

const Stats = () => {
  const navigate = useNavigate();
  const { userId, authChecked } = useContext(UserContext);
  const [scores, setScores] = useState([]);
  const [loadState, setLoadState] = useState("loading"); // loading | ready | error
  const [stats, setStats] = useState({
    highScore: 0,
    totalGames: 0,
    averageScore: 0,
    questionsAnswered: 0,
  });

  useEffect(() => {
    if (!authChecked) return;

    if (!userId) {
      navigate("/");
      return;
    }

    let cancelled = false;
    setLoadState("loading");

    get("/api/scores")
      .then((response) => {
        if (cancelled) return;

        const nextScores = Array.isArray(response.scores) ? response.scores : [];
        let highScore = Number(response.highScore) || 0;
        for (const s of nextScores) {
          if (s > highScore) highScore = s;
        }

        setScores(nextScores);
        setStats({
          highScore,
          totalGames: nextScores.length,
          averageScore:
            nextScores.length > 0
              ? Math.round(nextScores.reduce((a, b) => a + b, 0) / nextScores.length)
              : 0,
          questionsAnswered: nextScores.reduce((a, b) => a + b, 0),
        });
        setLoadState("ready");
      })
      .catch((err) => {
        console.log("Failed to get stats:", err);
        if (!cancelled) setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [userId, authChecked, navigate]);

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen text-stone-200">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-mono tracking-tight text-orange-400">stats</h1>
            <button
              onClick={handleBackToHome}
              className="px-5 py-2.5 text-sm font-medium text-stone-300 hover:text-white border border-stone-700 hover:border-stone-600 rounded transition-all duration-200"
            >
              back to home
            </button>
          </div>

          {loadState === "loading" && (
            <p className="text-sm text-stone-400 font-mono">loading stats...</p>
          )}
          {loadState === "error" && (
            <p className="text-sm text-red-400 font-mono">
              could not load stats — try refreshing or logging in again
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-stone-800/50 rounded-lg p-6 border border-stone-700">
              <p className="text-sm text-stone-400 mb-2">highest score</p>
              <p className="text-4xl font-mono text-orange-400">{stats.highScore}</p>
            </div>
            <div className="bg-stone-800/50 rounded-lg p-6 border border-stone-700">
              <p className="text-sm text-stone-400 mb-2">games played</p>
              <p className="text-4xl font-mono text-orange-400">{stats.totalGames}</p>
            </div>
            <div className="bg-stone-800/50 rounded-lg p-6 border border-stone-700">
              <p className="text-sm text-stone-400 mb-2">average score</p>
              <p className="text-4xl font-mono text-orange-400">{stats.averageScore}</p>
            </div>
            <div className="bg-stone-800/50 rounded-lg p-6 border border-stone-700">
              <p className="text-sm text-stone-400 mb-2">questions answered</p>
              <p className="text-4xl font-mono text-orange-400">{stats.questionsAnswered}</p>
            </div>
          </div>

          <div className="bg-stone-800/50 rounded-lg p-8 border border-stone-700">
            <Graph scores={scores} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
