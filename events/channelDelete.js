const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.ChannelDelete,
    async execute(channel) {
        logEvent(`🗑️ Channel deleted: **${channel.name}** (ID: ${channel.id}) in **${channel.guild?.name || 'Unknown'}**`);
    }
};
