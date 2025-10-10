const GuildConfig = require('./models/GuildConfig.js');

module.exports = {
  // 🧩 Get or create the guild's config
  getConfig: async function (guildId) {
    const config = await GuildConfig.findOneAndUpdate(
      { guildId },
      {},
      { upsert: true, new: true }
    );
    return config;
  },

  // ⚙️ Set a single value (like prefix or custom settings)
  setConfig: async function (guildId, key, value) {
    const config = await GuildConfig.findOneAndUpdate(
      { guildId },
      { [key]: value },
      { upsert: true, new: true }
    );
    return config;
  },

  // 🧱 Save a reaction role panel (messageId = panel message)
  saveReactionRolePanel: async function (guildId, messageId, data) {
    const config = await this.getConfig(guildId);
    if (!config.reactionRoles) config.reactionRoles = new Map();

    config.reactionRoles.set(messageId, data);
    await config.save();
    return config;
  },

  // 🗑️ Delete a specific panel
  deleteReactionRolePanel: async function (guildId, messageId) {
    const config = await this.getConfig(guildId);
    if (config.reactionRoles?.has(messageId)) {
      config.reactionRoles.delete(messageId);
      await config.save();
    }
    return config;
  },

  // 📋 List all panels in a guild
  listReactionRolePanels: async function (guildId) {
    const config = await this.getConfig(guildId);
    if (!config.reactionRoles) return [];
    return [...config.reactionRoles.entries()];
  },
};
