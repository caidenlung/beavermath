/** ESM re-export for the Vite client. Source of truth: problems.cjs */
import problems from "./problems.cjs";

export const ZETAMAC_DEFAULTS = problems.ZETAMAC_DEFAULTS;
export const generateProblem = problems.generateProblem;
export const generateProblems = problems.generateProblems;
export const createSeededRandom = problems.createSeededRandom;
export const maxOf = problems.maxOf;
export const maxAllowedScore = problems.maxAllowedScore;

export default problems;
