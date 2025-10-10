const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.GuildDelete,
    async execute(guild) {
        logEvent(`🔴 Bot removed from guild: **${guild.name || 'Unknown'}** (ID: ${guild.id})`);
    }
};
