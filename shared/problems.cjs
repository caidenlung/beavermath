/**
 * Zetamac-accurate arithmetic problem generation.
 *
 * Defaults match arithmetic.zetamac.com:
 *   Addition:       (2–100) + (2–100)
 *   Subtraction:    addition problems in reverse
 *   Multiplication: (2–12) × (2–100)
 *   Division:       multiplication problems in reverse
 */

const ZETAMAC_DEFAULTS = {
  addition: { min1: 2, max1: 100, min2: 2, max2: 100 },
  multiplication: { min1: 2, max1: 12, min2: 2, max2: 100 },
};

function randInt(min, max, random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function formatQuestion(num1, displayOperation, num2) {
  return `${num1} ${displayOperation} ${num2}`;
}

function generateAddition(random, ranges = ZETAMAC_DEFAULTS.addition) {
  const a = randInt(ranges.min1, ranges.max1, random);
  const b = randInt(ranges.min2, ranges.max2, random);
  return {
    num1: a,
    num2: b,
    operation: "+",
    displayOperation: "+",
    answer: a + b,
    question: formatQuestion(a, "+", b),
  };
}

/** Subtraction = addition in reverse: (a+b)−a or (a+b)−b */
function generateSubtraction(random, ranges = ZETAMAC_DEFAULTS.addition) {
  const a = randInt(ranges.min1, ranges.max1, random);
  const b = randInt(ranges.min2, ranges.max2, random);
  const sum = a + b;
  if (random() < 0.5) {
    return {
      num1: sum,
      num2: a,
      operation: "-",
      displayOperation: "-",
      answer: b,
      question: formatQuestion(sum, "-", a),
    };
  }
  return {
    num1: sum,
    num2: b,
    operation: "-",
    displayOperation: "-",
    answer: a,
    question: formatQuestion(sum, "-", b),
  };
}

function generateMultiplication(random, ranges = ZETAMAC_DEFAULTS.multiplication) {
  const a = randInt(ranges.min1, ranges.max1, random);
  const b = randInt(ranges.min2, ranges.max2, random);
  return {
    num1: a,
    num2: b,
    operation: "*",
    displayOperation: "×",
    answer: a * b,
    question: formatQuestion(a, "×", b),
  };
}

/** Division = multiplication in reverse: (a×b)÷a or (a×b)÷b */
function generateDivision(random, ranges = ZETAMAC_DEFAULTS.multiplication) {
  const a = randInt(ranges.min1, ranges.max1, random);
  const b = randInt(ranges.min2, ranges.max2, random);
  const product = a * b;
  if (random() < 0.5) {
    return {
      num1: product,
      num2: a,
      operation: "/",
      displayOperation: "÷",
      answer: b,
      question: formatQuestion(product, "÷", a),
    };
  }
  return {
    num1: product,
    num2: b,
    operation: "/",
    displayOperation: "÷",
    answer: a,
    question: formatQuestion(product, "÷", b),
  };
}

const GENERATORS = [
  generateAddition,
  generateSubtraction,
  generateMultiplication,
  generateDivision,
];

function generateProblem(random = Math.random) {
  const generator = GENERATORS[Math.floor(random() * GENERATORS.length)];
  return generator(random);
}

function generateProblems(count, random = Math.random) {
  const problems = [];
  for (let i = 0; i < count; i++) {
    const problem = generateProblem(random);
    problems.push({
      question: problem.question,
      answer: problem.answer,
    });
  }
  return problems;
}

function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function maxOf(numbers) {
  let max = 0;
  for (const n of numbers) {
    if (typeof n === "number" && n > max) max = n;
  }
  return max;
}

function maxAllowedScore(durationSeconds) {
  const duration = Number(durationSeconds);
  if (!Number.isFinite(duration) || duration <= 0) return 500;
  return Math.min(500, Math.ceil(duration * 3));
}

module.exports = {
  ZETAMAC_DEFAULTS,
  generateProblem,
  generateProblems,
  createSeededRandom,
  maxOf,
  maxAllowedScore,
};
