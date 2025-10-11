const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        if (!message) return;
        if (message.author?.bot) return;
        logEvent(`🗑️ Message deleted in #${message.channel?.name || 'unknown'} by **${message.author?.tag || 'unknown'}**: ${message.content?.slice(0, 1900)}`);
    }
};
