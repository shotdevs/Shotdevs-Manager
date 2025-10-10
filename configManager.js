const GuildConfig = require('./models/GuildConfig.js');

module.exports = {
    getConfig: async function(guildId) {
        // Find the config for this guild, or create a new one if it doesn't exist
        const config = await GuildConfig.findOneAndUpdate(
            { guildId: guildId },
            {}, // No updates needed, just find or create
            { upsert: true, new: true } // upsert:true creates if not found
        );
        return config;
    },

    setConfig: async function(guildId, key, value) {
        // Find the config and update a specific key-value pair
        const config = await GuildConfig.findOneAndUpdate(
            { guildId: guildId },
            { [key]: value },
            { upsert: true, new: true }
        );
        return config;
    }
};
