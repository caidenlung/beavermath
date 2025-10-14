/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");
const Duel = require("./models/duel");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user)
    socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

// Get leaderboard data
router.get("/leaderboard", (req, res) => {
  User.find({}).then((users) => {
    // Get highest score for each user
    const leaderboardData = users
      .map((user) => ({
        name: user.name,
        score: Math.max(...user.scores, 0), // Use 0 if no scores
      }))
      .filter((user) => user.score > 0) // Only show users with scores
      .sort((a, b) => b.score - a.score) // Sort by highest score
      .slice(0, 10); // Top 10 only

    res.send(leaderboardData);
  });
});

// Handle Scores submissions
router.post("/score", auth.ensureLoggedIn, (req, res) => {
  User.findById(req.user._id).then((user) => {
    user.scores.push(req.body.score);
    user.save().then((savedUser) => {
      // After saving, emit updated leaderboard to all clients
      User.find({}).then((users) => {
        const leaderboardData = users
          .map((user) => ({
            name: user.name,
            score: Math.max(...user.scores, 0),
          }))
          .filter((user) => user.score > 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 10);

        socketManager.getIo().emit("leaderboard", leaderboardData);
      });

      res.send(savedUser);
    });
  });
});

// Send all scores of the user
router.get("/scores", auth.ensureLoggedIn, (req, res) => {
  if (!req.user) {
    return res.status(401).send({ error: "Not logged in" });
  }

  User.findById(req.user._id)
    .then((user) => {
      if (!user) {
        return res.status(404).send({ error: "User not found" });
      }
      res.send({ scores: user.scores || [] });
    })
    .catch((err) => {
      console.log(`Failed to get scores: ${err}`);
      res.status(500).send({ error: "Failed to get scores" });
    });
});

// Create a new duel
router.post("/duel/create", auth.ensureLoggedIn, async (req, res) => {
  try {
    const duration = parseInt(req.body.duration);

    // Validate duration
    if (isNaN(duration) || duration < 30 || duration > 300) {
      return res.status(400).send({ error: "Duration must be between 30 and 300 seconds" });
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const duel = new Duel({
      code: code,
      host: req.user._id,
      duration: duration,
    });

    await duel.save();
    await duel.populate("host", "name");

    console.log("Created duel with duration:", duration);
    res.send({ duel });
  } catch (err) {
    console.error("Error creating duel:", err);
    res.status(500).send({ error: "Could not create duel" });
  }
});

// Join a duel
router.post("/duel/join", auth.ensureLoggedIn, async (req, res) => {
  try {
    console.log("Join duel request:", req.body);
    const duel = await Duel.findOne({ code: req.body.code, status: "waiting" })
      .populate("host", "name")
      .populate("opponent", "name");

    if (!duel) {
      console.log("Duel not found or already started");
      return res.status(404).send({ error: "Duel not found or already started" });
    }

    // Check if user is already the host
    if (duel.host && duel.host._id.toString() === req.user._id.toString()) {
      return res.status(400).send({ error: "You cannot join your own duel" });
    }

    // Check if duel already has an opponent
    if (duel.opponent) {
      return res.status(400).send({ error: "Duel is already full" });
    }

    console.log("Found duel:", duel);

    duel.opponent = req.user._id;
    await duel.save();
    await duel.populate("opponent", "name");

    console.log("Updated duel:", duel);

    // Make sure the joining player is in the socket room
    const socket = socketManager.getSocketFromUserID(req.user._id);
    if (socket) {
      socket.join(duel.code);
    }

    // Get host's socket and notify them
    const hostSocket = socketManager.getSocketFromUserID(duel.host._id);
    if (hostSocket) {
      // Emit directly to the host socket
      hostSocket.emit("opponent_joined", {
        duel,
        opponentName: req.user.name,
      });
    } else {
      console.log("Warning: Could not find socket for host", duel.host._id);
    }

    res.send({ duel });
  } catch (error) {
    console.error("Error joining duel:", error);
    res.status(500).send({ error: "Failed to join duel" });
  }
});

// Start duel (host only)
router.post("/duel/:code/start", auth.ensureLoggedIn, async (req, res) => {
  try {
    const duel = await Duel.findOne({ code: req.params.code })
      .populate("host", "name")
      .populate("opponent", "name");

    if (!duel) {
      console.log("Duel not found with code:", req.params.code);
      return res.status(404).send({ error: "Duel not found" });
    }

    // Verify user is host
    if (duel.host._id.toString() !== req.user._id.toString()) {
      return res.status(403).send({ error: "Only the host can start the duel" });
    }

    // Get socket IDs for both players
    const hostSocket = socketManager.getSocketFromUserID(duel.host._id);
    const opponentSocket = socketManager.getSocketFromUserID(duel.opponent._id);

    if (!hostSocket || !opponentSocket) {
      return res.status(400).send({ error: "Both players must be connected" });
    }

    // Add socket IDs to the duel object for client-side identification
    duel.host.socketId = hostSocket.id;
    duel.opponent.socketId = opponentSocket.id;

    // Generate questions if not already generated
    if (!duel.questions || duel.questions.length === 0) {
      const questions = [];
      // Custom random number generator with seed
      let seedValue = Date.now();
      const seededRandom = () => {
        seedValue = (seedValue * 9301 + 49297) % 233280;
        return seedValue / 233280;
      };

      const getRandomNumber = (min, max) => Math.floor(seededRandom() * (max - min + 1)) + min;
      const getRandomLargeNumber = () => getRandomNumber(2, 100);
      const getRandomSmallNumber = () => getRandomNumber(2, 12);
      const operations = ["+", "-", "*", "/"];

      // Generate 500 questions (players likely won't get through all of them)
      for (let i = 0; i < 500; i++) {
        const operation = operations[Math.floor(seededRandom() * operations.length)];
        let num1, num2, answer;

        switch (operation) {
          case "+":
            num1 = getRandomLargeNumber();
            num2 = getRandomLargeNumber();
            answer = num1 + num2;
            break;
          case "-":
            num1 = getRandomLargeNumber();
            num2 = Math.floor(seededRandom() * (num1 - 2)) + 2;
            answer = num1 - num2;
            break;
          case "*":
            num1 = getRandomSmallNumber();
            num2 = getRandomLargeNumber();
            answer = num1 * num2;
            break;
          case "/":
            num2 = getRandomSmallNumber();
            const multiplier = getRandomLargeNumber();
            num1 = num2 * multiplier;
            answer = num1 / num2;
            break;
        }

        questions.push({
          question: `${num1} ${
            operation === "/" ? "÷" : operation === "*" ? "×" : operation
          } ${num2}`,
          answer: answer,
        });
      }
      duel.questions = questions;
      await duel.save();
    }

    duel.status = "in_progress";
    await duel.save();

    const startTime = new Date();
    socketManager.getIo().to(duel.code).emit("duel_started", {
      duel,
      startTime,
      duration: duel.duration,
    });

    res.send({ success: true });
  } catch (err) {
    console.error("Error starting duel:", err);
    res.status(500).send({ error: "Could not start duel" });
  }
});

// Get duel status
router.get("/duel/:code", auth.ensureLoggedIn, async (req, res) => {
  try {
    const duel = await Duel.findOne({ code: req.params.code })
      .populate("host", "name")
      .populate("opponent", "name");
    if (!duel) {
      return res.status(404).send({ error: "Duel not found" });
    }
    res.send({ duel });
  } catch (err) {
    res.status(500).send({ error: "Could not get duel status" });
  }
});

// Submit duel scores
router.post("/duel/:code/score", auth.ensureLoggedIn, async (req, res) => {
  try {
    const duel = await Duel.findOne({ code: req.params.code });
    if (!duel) {
      return res.status(404).send({ error: "Duel not found" });
    }

    if (duel.host.equals(req.user._id)) {
      duel.hostScore = req.body.score;
    } else if (duel.opponent.equals(req.user._id)) {
      duel.opponentScore = req.body.score;
    }
    if (duel.hostScore > 0 && duel.opponentScore > 0) {
      duel.status = "completed";
    }
    await duel.save();
    socketManager.getIo().to(duel.code).emit("duel_score_update", { duel });
    res.send({ duel });
  } catch (err) {
    res.status(500).send({ error: "Could not submit score" });
  }
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
