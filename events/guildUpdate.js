const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.GuildUpdate,
    async execute(oldGuild, newGuild) {
        logEvent(`♻️ Guild updated: **${oldGuild.name}** (ID: ${oldGuild.id})`);
    }
};
