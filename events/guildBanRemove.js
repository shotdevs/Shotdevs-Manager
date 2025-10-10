const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.GuildBanRemove,
    async execute(guild, user) {
        logEvent(`🏳️ User unbanned: **${user.tag || user.id}** from **${guild.name}**`);
    }
};
