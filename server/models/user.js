const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  googleid: String,
  scores: { type: [Number], default: [] },
});

// compile model from schema
module.exports = mongoose.model("user", UserSchema);
