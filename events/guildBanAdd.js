const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.GuildBanAdd,
    async execute(guild, user) {
        logEvent(`🔨 User banned: **${user.tag || user.id}** from **${guild.name}**`);
    }
};
