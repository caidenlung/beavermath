import React, { useState, useEffect } from "react";
import { generateProblem } from "@shared/problems.js";

const Questions = ({ onCorrectAnswer }) => {
  const [currentQuestion, setCurrentQuestion] = useState(() => generateProblem());
  const [userAnswer, setUserAnswer] = useState("");

  // Keep focus behavior stable when the question advances
  useEffect(() => {
    setUserAnswer("");
  }, [currentQuestion]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setUserAnswer(value);

    if (value === "") return;

    const parsed = Number.parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed === currentQuestion.answer) {
      onCorrectAnswer();
      setCurrentQuestion(generateProblem());
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 sm:space-y-10">
      <div className="space-y-8">
        <div className="text-center">
          <p className="text-4xl sm:text-5xl font-mono text-white">
            {currentQuestion.num1} {currentQuestion.displayOperation} {currentQuestion.num2}
          </p>
        </div>
      </div>
      <div className="w-full max-w-sm px-4 sm:px-0">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={userAnswer}
          onChange={handleInputChange}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 sm:px-6 py-4 sm:py-5 text-3xl sm:text-4xl font-mono text-center text-zinc-200 focus:outline-none focus:border-orange-400 transition-colors"
          autoComplete="off"
          autoFocus
        />
      </div>
    </div>
  );
};

export default Questions;
