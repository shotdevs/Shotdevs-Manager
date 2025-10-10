const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.GuildCreate,
    async execute(guild) {
        logEvent(`🟢 Bot joined guild: **${guild.name}** (ID: ${guild.id})`);
    }
};
