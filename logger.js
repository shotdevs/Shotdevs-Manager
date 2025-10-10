// logger.js
// Utility to log bot/server events to a specific channel and provide debug logging
const { Client, ChannelType } = require('discord.js');
const LOG_CHANNEL_ID = '1426083620740665455';

let clientInstance = null;

function setClient(client) {
    clientInstance = client;
}

async function logEvent(message, embed = null) {
    if (!clientInstance) return;
    try {
        const channel = await clientInstance.channels.fetch(LOG_CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) return;
        if (embed) {
            await channel.send({ content: message, embeds: [embed] });
        } else {
            await channel.send({ content: message });
        }
    } catch (err) {
        // Fallback: print to console
        console.error('Failed to log event to channel:', err);
    }
}

function debugLog(...args) {
    // Print to console and send to log channel if possible
    console.debug('[DEBUG]', ...args);
    if (clientInstance) {
        logEvent('**[DEBUG]** ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
    }
}

module.exports = {
    setClient,
    logEvent,
    debugLog,
};
