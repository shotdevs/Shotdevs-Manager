const mongoose = require("mongoose");

const LevelSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  voiceXP: { type: Number, default: 0 },
  background: { type: String, default: null }
});

module.exports = mongoose.model("Level", LevelSchema);
