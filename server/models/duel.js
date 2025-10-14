const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const DuelSchema = new mongoose.Schema({
  code: String,
  host: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  opponent: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  status: {
    type: String,
    enum: ["waiting", "in_progress", "completed"],
    default: "waiting",
  },
  startedAt: { type: Date }, // When the duel actually begins
  duration: { type: Number, default: 120 },
  hostScore: { type: Number, default: 0 },
  opponentScore: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  questions: [{
    question: String,
    answer: Number,
  }],
  // Add an expireAt field that will be set when the duel starts
  expireAt: { type: Date, index: { expires: 0 } },
});

// Before saving, calculate when this document should expire
DuelSchema.pre('save', function(next) {
  if (this.startedAt && this.duration) {
    // Set expireAt to startedAt + duration + 10 seconds (buffer time)
    this.expireAt = new Date(this.startedAt.getTime() + (this.duration + 10) * 1000);
  }
  next();
});

module.exports = mongoose.model("Duel", DuelSchema);
