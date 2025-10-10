const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel) {
        logEvent(`📁 Channel created: **${channel.name}** (ID: ${channel.id}) in **${channel.guild?.name || 'Unknown'}**`);
    }
};
