const mongoose = require("mongoose");

const GameSchema = new mongoose.Schema({
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  opponent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  hostScore: {
    type: Number,
    required: true,
  },
  opponentScore: {
    type: Number,
    required: true,
  },
  winner: {
    type: String,
    enum: ["host", "opponent", "tie"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// compile model from schema
module.exports = mongoose.model("game", GameSchema);
