import React, { useState, useEffect, useRef } from "react";
import Timer from "../play-modules/Timer";
import Scores from "../play-modules/scores";
import { useNavigate, useLocation } from "react-router-dom";
import { socket } from "../../../client-socket";
import { get } from "../../../utilities";

const DuelPlay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { duel, startTime, duration } = location.state || {};

  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [myName, setMyName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [userId, setUserId] = useState(null);

  const myNameRef = useRef("");
  const opponentNameRef = useRef("");
  const isHostRef = useRef(false);
  const endedRef = useRef(false);

  useEffect(() => {
    get("/api/whoami").then((user) => {
      if (user && user._id) setUserId(user._id);
    });
  }, []);

  useEffect(() => {
    if (!duel || !startTime || !duration) {
      navigate("/duel");
      return;
    }
    if (!userId) return;

    const isUserHost = userId === duel.host._id;
    isHostRef.current = isUserHost;

    const nextMyName = isUserHost ? duel.host.name : duel.opponent.name;
    const nextOpponentName = isUserHost ? duel.opponent.name : duel.host.name;
    setMyName(nextMyName);
    setOpponentName(nextOpponentName);
    myNameRef.current = nextMyName;
    opponentNameRef.current = nextOpponentName;

    if (duel.questions && duel.questions.length > 0) {
      setCurrentQuestion(duel.questions[0]);
      setQuestionIndex(0);
    }

    const onScoreUpdated = ({ hostScore, opponentScore }) => {
      if (isHostRef.current) {
        setMyScore(hostScore);
        setOpponentScore(opponentScore);
      } else {
        setMyScore(opponentScore);
        setOpponentScore(hostScore);
      }
    };

    const onDuelComplete = ({ hostScore, opponentScore, winner: winnerRole }) => {
      setIsGameOver(true);
      if (isHostRef.current) {
        setMyScore(hostScore);
        setOpponentScore(opponentScore);
        setWinner(
          winnerRole === "host"
            ? myNameRef.current
            : winnerRole === "opponent"
              ? opponentNameRef.current
              : "Tie"
        );
      } else {
        setMyScore(opponentScore);
        setOpponentScore(hostScore);
        setWinner(
          winnerRole === "opponent"
            ? myNameRef.current
            : winnerRole === "host"
              ? opponentNameRef.current
              : "Tie"
        );
      }
    };

    socket.on("score_updated", onScoreUpdated);
    socket.on("duel_complete", onDuelComplete);

    return () => {
      socket.off("score_updated", onScoreUpdated);
      socket.off("duel_complete", onDuelComplete);
    };
  }, [duel, startTime, duration, userId, navigate]);

  useEffect(() => {
    if (!startTime || !duration || !duel?.code) return;

    const endTime = new Date(startTime).getTime() + duration * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining === 0 && !endedRef.current) {
        endedRef.current = true;
        clearInterval(timer);
        socket.emit("duel_ended", duel.code);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [startTime, duration, duel]);

  const advanceOnCorrect = () => {
    setMyScore((prev) => {
      const newScore = prev + 1;
      socket.emit("update_score", {
        duelCode: duel.code,
        newScore,
      });
      return newScore;
    });

    setUserAnswer("");
    setQuestionIndex((prev) => {
      const next = prev + 1;
      if (duel.questions && next < duel.questions.length) {
        setCurrentQuestion(duel.questions[next]);
      }
      return next;
    });
  };

  const tryAnswer = (rawValue) => {
    if (!currentQuestion || isGameOver) return;
    if (rawValue === "") return;

    const parsed = Number.parseInt(rawValue, 10);
    if (!Number.isNaN(parsed) && parsed === currentQuestion.answer) {
      advanceOnCorrect();
    }
  };

  if (!duel || !currentQuestion) {
    return <div className="text-center text-stone-200">Loading...</div>;
  }

  return (
    <div className="min-h-screen text-stone-200">
      {!isGameOver ? (
        <div className="h-screen flex flex-col">
          <div className="w-full px-4 sm:px-12 py-6 flex justify-between items-center">
            <Timer timeLeft={timeLeft} controlled />
            <div className="bg-zinc-800/50 rounded-lg px-6 py-4 border border-zinc-700">
              <p className="text-sm text-zinc-400 mb-1 text-center">{myName.toLowerCase()}</p>
              <p className="text-2xl font-mono text-orange-400 text-center">{myScore}</p>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center -mt-20">
            <div className="w-full max-w-2xl">
              <div className="flex flex-col items-center space-y-10">
                <div className="text-6xl font-mono tracking-wider text-white">
                  {currentQuestion?.question}
                </div>

                <div className="w-full max-w-sm">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={userAnswer}
                    onChange={(e) => {
                      const value = e.target.value;
                      setUserAnswer(value);
                      tryAnswer(value);
                    }}
                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-6 py-5 text-4xl font-mono text-center text-white focus:outline-none focus:border-orange-500 transition-colors"
                    autoComplete="off"
                    autoFocus
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full px-4 sm:px-12 py-6 flex justify-end">
            <div className="bg-zinc-800/50 rounded-lg px-6 py-4 border border-zinc-700">
              <p className="text-sm text-zinc-400 mb-1 text-center">{opponentName.toLowerCase()}</p>
              <p className="text-2xl font-mono text-orange-400 text-center">?</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="flex flex-col items-center space-y-16">
            <h1 className="text-5xl sm:text-7xl font-mono tracking-tight text-orange-400">
              {winner === "Tie" ? "it's a tie!" : `${winner.toLowerCase()} won!`}
            </h1>
            <div className="flex flex-col sm:flex-row gap-8 sm:gap-24 items-center">
              <Scores score={myScore} label={myName.toLowerCase()} />
              <Scores score={opponentScore} label={opponentName.toLowerCase()} />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate("/duel")}
                className="px-6 sm:px-8 py-3 sm:py-4 text-base font-medium text-stone-300 hover:text-white border border-stone-700 hover:border-stone-600 rounded transition-all duration-200"
              >
                back to duels
              </button>
              <button
                onClick={() => navigate("/")}
                className="px-6 sm:px-8 py-3 sm:py-4 text-base font-medium text-stone-300 hover:text-white border border-stone-700 hover:border-stone-600 rounded transition-all duration-200"
              >
                back to home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DuelPlay;
