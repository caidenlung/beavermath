import React, { useState, useEffect } from "react";
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
  const [isHost, setIsHost] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [myName, setMyName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Get current user's ID
    get("/api/whoami").then((user) => {
      setUserId(user._id);
    });
  }, []);

  useEffect(() => {
    if (!duel || !startTime || !duration || !userId) {
      console.log("Missing required data:", { duel, startTime, duration, userId });
      if (duel && startTime && duration) return; // Only navigate away if missing duel data
      navigate("/duel");
      return;
    }

    // Determine if user is host based on user ID
    const isUserHost = userId === duel.host._id;
    setIsHost(isUserHost);
    console.log("User is host:", isUserHost);

    // Set player names based on role
    if (isUserHost) {
      setMyName(duel.host.name);
      setOpponentName(duel.opponent.name);
    } else {
      setMyName(duel.opponent.name);
      setOpponentName(duel.host.name);
    }

    // Set initial question
    if (duel.questions && duel.questions.length > 0) {
      setCurrentQuestion(duel.questions[0]);
    }

    // Listen for score updates
    socket.on("score_updated", ({ hostScore, opponentScore }) => {
      if (isUserHost) {
        setMyScore(hostScore);
        setOpponentScore(opponentScore);
      } else {
        setMyScore(opponentScore);
        setOpponentScore(hostScore);
      }
    });

    // Listen for game completion
    socket.on("duel_complete", ({ hostScore, opponentScore, winner }) => {
      setIsGameOver(true);
      if (isUserHost) {
        setMyScore(hostScore);
        setOpponentScore(opponentScore);
        setWinner(winner === "host" ? myName : winner === "opponent" ? opponentName : "Tie");
      } else {
        setMyScore(opponentScore);
        setOpponentScore(hostScore);
        setWinner(winner === "opponent" ? myName : winner === "host" ? opponentName : "Tie");
      }
    });

    return () => {
      socket.off("score_updated");
      socket.off("duel_complete");
    };
  }, [duel, startTime, duration, userId, navigate, myName, opponentName]);

  useEffect(() => {
    if (!startTime || !duration) return;

    const endTime = new Date(startTime).getTime() + duration * 1000;
    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(Math.ceil(remaining / 1000));

      if (remaining === 0) {
        clearInterval(timer);
        socket.emit("duel_ended", duel.code);
      }
    }, 100);

    return () => clearInterval(timer);
  }, [startTime, duration, duel]);

  const handleCorrectAnswer = () => {
    // Update score
    setMyScore((prev) => {
      const newScore = prev + 1;
      socket.emit("update_score", {
        duelCode: duel.code,
        newScore: newScore,
      });
      return newScore;
    });

    // Clear input and move to next question
    setUserAnswer("");
    if (questionIndex < duel.questions.length - 1) {
      setQuestionIndex((prev) => prev + 1);
      setCurrentQuestion(duel.questions[questionIndex + 1]);
    }
  };

  const handleBackToDuels = () => {
    navigate("/duel");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (!duel || !currentQuestion) {
    return <div className="text-center text-stone-200">Loading...</div>;
  }

  return (
    <div className="min-h-screen text-stone-200">
      {!isGameOver ? (
        <div className="h-screen flex flex-col">
          <div className="w-full px-4 sm:px-12 py-6 flex justify-between items-center">
            <Timer timeLeft={timeLeft} />
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
                    type="number"
                    value={userAnswer}
                    onChange={(e) => {
                      setUserAnswer(e.target.value);
                      if (e.target.value === currentQuestion?.answer.toString()) {
                        handleCorrectAnswer();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCorrectAnswer();
                      }
                    }}
                    className="w-full bg-zinc-900/50 border border-zinc-700 rounded-lg px-6 py-5 text-4xl font-mono text-center text-white focus:outline-none focus:border-orange-500 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
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
