/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
*/

const express = require("express");

const User = require("./models/user");
const Duel = require("./models/duel");
const auth = require("./auth");
const {
  generateProblems,
  createSeededRandom,
  maxOf,
  maxAllowedScore,
} = require("../shared/problems.cjs");

const router = express.Router();
const socketManager = require("./server-socket");

const MAX_STORED_SCORES = 500;

function sanitizeDuel(duel) {
  if (!duel) return duel;
  const obj = typeof duel.toObject === "function" ? duel.toObject() : { ...duel };
  if (Array.isArray(obj.questions)) {
    obj.questions = obj.questions.map(({ question }) => ({ question }));
  }
  return obj;
}

/** Enough questions for the duration without shipping a huge bank */
function duelQuestionCount(durationSeconds) {
  return Math.min(500, Math.max(100, Math.ceil(Number(durationSeconds) * 2) || 100));
}

async function backfillHighScoresIfNeeded() {
  // Legacy users may still have scores[] but highScore left at 0 after the denormalization deploy.
  // Only touch those users — not "skip entirely if anyone already has a highScore".
  const users = await User.find({
    $and: [
      { "scores.0": { $exists: true } },
      { $or: [{ highScore: { $exists: false } }, { highScore: null }, { highScore: { $lte: 0 } }] },
    ],
  }).select("scores highScore");

  if (users.length === 0) return;

  await Promise.all(
    users.map((user) => {
      const computed = maxOf(user.scores || []);
      if (computed <= (user.highScore || 0)) return null;
      user.highScore = computed;
      return user.save();
    })
  );
}

async function fetchLeaderboard() {
  await backfillHighScoresIfNeeded();

  const users = await User.find({ highScore: { $gt: 0 } })
    .sort({ highScore: -1 })
    .limit(10)
    .select("name highScore")
    .lean();

  return users.map((user) => ({
    name: user.name,
    score: user.highScore,
  }));
}

async function emitLeaderboard() {
  const leaderboard = await fetchLeaderboard();
  socketManager.getIo().emit("leaderboard", leaderboard);
}

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    return res.send({});
  }
  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  if (req.user) {
    socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
  }
  res.send({});
});

router.get("/leaderboard", async (req, res) => {
  try {
    res.send(await fetchLeaderboard());
  } catch (err) {
    console.error("Failed to get leaderboard:", err);
    res.status(500).send({ error: "Failed to get leaderboard" });
  }
});

router.post("/score", auth.ensureLoggedIn, async (req, res) => {
  try {
    const score = Number(req.body.score);
    const duration = Number(req.body.duration);
    const maxScore = maxAllowedScore(duration);

    if (!Number.isInteger(score) || score < 0 || score > maxScore) {
      return res.status(400).send({ error: `Score must be an integer between 0 and ${maxScore}` });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }

    user.scores.push(score);
    if (user.scores.length > MAX_STORED_SCORES) {
      user.scores = user.scores.slice(-MAX_STORED_SCORES);
    }
    user.highScore = Math.max(user.highScore || 0, score, maxOf(user.scores));
    const savedUser = await user.save();

    await emitLeaderboard();
    res.send(savedUser);
  } catch (err) {
    console.error("Failed to save score:", err);
    res.status(500).send({ error: "Failed to save score" });
  }
});

router.get("/scores", auth.ensureLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("scores highScore");
    if (!user) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send({ scores: user.scores || [], highScore: user.highScore || 0 });
  } catch (err) {
    console.log(`Failed to get scores: ${err}`);
    res.status(500).send({ error: "Failed to get scores" });
  }
});

router.post("/duel/create", auth.ensureLoggedIn, async (req, res) => {
  try {
    const duration = parseInt(req.body.duration, 10);

    if (isNaN(duration) || duration < 30 || duration > 300) {
      return res.status(400).send({ error: "Duration must be between 30 and 300 seconds" });
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const duel = new Duel({
      code,
      host: req.user._id,
      duration,
    });

    await duel.save();
    await duel.populate("host", "name");

    res.send({ duel: sanitizeDuel(duel) });
  } catch (err) {
    console.error("Error creating duel:", err);
    res.status(500).send({ error: "Could not create duel" });
  }
});

router.post("/duel/join", auth.ensureLoggedIn, async (req, res) => {
  try {
    const code = String(req.body.code || "")
      .trim()
      .toUpperCase();
    const duel = await Duel.findOne({ code, status: "waiting" })
      .populate("host", "name")
      .populate("opponent", "name");

    if (!duel) {
      return res.status(404).send({ error: "Duel not found or already started" });
    }

    if (duel.host && duel.host._id.toString() === req.user._id.toString()) {
      return res.status(400).send({ error: "You cannot join your own duel" });
    }

    if (duel.opponent) {
      return res.status(400).send({ error: "Duel is already full" });
    }

    duel.opponent = req.user._id;
    await duel.save();
    await duel.populate("opponent", "name");

    const socket = socketManager.getSocketFromUserID(req.user._id);
    if (socket) {
      socket.join(duel.code);
    }

    const hostSocket = socketManager.getSocketFromUserID(duel.host._id);
    if (hostSocket) {
      hostSocket.emit("opponent_joined", {
        duel: sanitizeDuel(duel),
        opponentName: req.user.name,
      });
    }

    res.send({ duel: sanitizeDuel(duel) });
  } catch (error) {
    console.error("Error joining duel:", error);
    res.status(500).send({ error: "Failed to join duel" });
  }
});

router.post("/duel/:code/start", auth.ensureLoggedIn, async (req, res) => {
  try {
    const duel = await Duel.findOne({ code: req.params.code })
      .populate("host", "name")
      .populate("opponent", "name");

    if (!duel) {
      return res.status(404).send({ error: "Duel not found" });
    }

    if (duel.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: "Only the host can start the duel" });
    }

    if (!duel.opponent) {
      return res.status(400).send({ error: "Waiting for an opponent" });
    }

    const hostSocket = socketManager.getSocketFromUserID(duel.host._id);
    const opponentSocket = socketManager.getSocketFromUserID(duel.opponent._id);

    if (!hostSocket || !opponentSocket) {
      return res.status(400).send({ error: "Both players must be connected" });
    }

    if (!duel.questions || duel.questions.length === 0) {
      const seed = Date.now() ^ (Math.random() * 0x100000000);
      duel.questions = generateProblems(
        duelQuestionCount(duel.duration),
        createSeededRandom(seed)
      );
    }

    duel.status = "in_progress";
    duel.startedAt = new Date();
    duel.hostScore = 0;
    duel.opponentScore = 0;
    await duel.save();

    const startTime = duel.startedAt;
    const payload = {
      duel: duel.toObject(),
      startTime,
      duration: duel.duration,
    };

    socketManager.getIo().to(duel.code).emit("duel_started", payload);
    res.send({ success: true });
  } catch (err) {
    console.error("Error starting duel:", err);
    res.status(500).send({ error: "Could not start duel" });
  }
});

router.get("/duel/:code", auth.ensureLoggedIn, async (req, res) => {
  try {
    const duel = await Duel.findOne({ code: req.params.code })
      .populate("host", "name")
      .populate("opponent", "name");
    if (!duel) {
      return res.status(404).send({ error: "Duel not found" });
    }

    const isParticipant =
      (duel.host && duel.host._id.toString() === req.user._id.toString()) ||
      (duel.opponent && duel.opponent._id.toString() === req.user._id.toString());

    if (!isParticipant) {
      return res.status(403).send({ error: "Not a participant in this duel" });
    }

    res.send({ duel: sanitizeDuel(duel) });
  } catch (err) {
    res.status(500).send({ error: "Could not get duel status" });
  }
});

router.post("/duel/:code/score", auth.ensureLoggedIn, async (req, res) => {
  try {
    const duel = await Duel.findOne({ code: req.params.code });
    if (!duel) {
      return res.status(404).send({ error: "Duel not found" });
    }

    const score = Number(req.body.score);
    const maxScore = Math.min(duel.questions?.length || 500, maxAllowedScore(duel.duration));

    if (!Number.isInteger(score) || score < 0 || score > maxScore) {
      return res.status(400).send({ error: "Invalid score" });
    }

    if (duel.host.equals(req.user._id)) {
      if (score < duel.hostScore || score > duel.hostScore + 1) {
        return res.status(400).send({ error: "Score can only increase by 1" });
      }
      duel.hostScore = score;
    } else if (duel.opponent && duel.opponent.equals(req.user._id)) {
      if (score < duel.opponentScore || score > duel.opponentScore + 1) {
        return res.status(400).send({ error: "Score can only increase by 1" });
      }
      duel.opponentScore = score;
    } else {
      return res.status(403).send({ error: "Not a participant in this duel" });
    }

    await duel.save();
    socketManager.getIo().to(duel.code).emit("duel_score_update", { duel: sanitizeDuel(duel) });
    res.send({ duel: sanitizeDuel(duel) });
  } catch (err) {
    res.status(500).send({ error: "Could not submit score" });
  }
});

router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
