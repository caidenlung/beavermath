const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  googleid: String,
  scores: { type: [Number], default: [] },
  highScore: { type: Number, default: 0, index: true },
});

module.exports = mongoose.model("user", UserSchema);
