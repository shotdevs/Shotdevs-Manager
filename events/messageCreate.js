const { Events } = require('discord.js');
const { logEvent } = require('../logger');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author?.bot) return; // ignore bot messages
        logEvent(`💬 Message sent in #${message.channel?.name || 'unknown'} by **${message.author.tag}**: ${message.content?.slice(0, 1900)}`);
    }
};
