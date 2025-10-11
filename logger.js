// logger.js
// Utility to log bot/server events to a specific channel and provide debug logging
const { Client, ChannelType } = require('discord.js');
const LOG_CHANNEL_ID = '1426083620740665455';

// Log level colors
const LOG_COLORS = {
    INFO: 0x0099ff,    // Blue
    WARNING: 0xffaa00,  // Orange
    ERROR: 0xff0000,    // Red
    SUCCESS: 0x00ff00,  // Green
    DEBUG: 0x808080    // Gray
};

let clientInstance = null;

function setClient(client) {
    clientInstance = client;
}

async function logEvent(message, options = {}) {
    if (!clientInstance) return;
    try {
        const channel = await clientInstance.channels.fetch(LOG_CHANNEL_ID);
        if (!channel || channel.type !== ChannelType.GuildText) return;
        
        const {
            level = 'INFO',
            title = '',
            fields = [],
            thumbnail = null,
            image = null,
            embed = null
        } = options;

        // Create default embed if none provided
        const defaultEmbed = {
            color: LOG_COLORS[level] || LOG_COLORS.INFO,
            title: title,
            description: message,
            fields: fields,
            timestamp: new Date(),
            footer: {
                text: `${level} | Bot Logging System`
            }
        };

        // Add thumbnail and image if provided
        if (thumbnail) defaultEmbed.thumbnail = { url: thumbnail };
        if (image) defaultEmbed.image = { url: image };

        await channel.send({ embeds: [embed || defaultEmbed] });
    } catch (err) {
        // Fallback: print to console
        console.error('Failed to log event to channel:', err);
    }
}

function debugLog(...args) {
    // Print to console and send to log channel if possible
    console.debug('[DEBUG]', ...args);
    if (clientInstance) {
        const debugEmbed = {
            color: 0xffaa00, // Orange color for debug messages
            title: 'Debug Log',
            description: '**[DEBUG]** ' + args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '),
            timestamp: new Date(),
            footer: {
                text: 'Debug Information'
            }
        };
        logEvent(null, debugEmbed);
    }
}

// Convenience methods for different log levels
function info(message, options = {}) {
    return logEvent(message, { ...options, level: 'INFO' });
}

function warning(message, options = {}) {
    return logEvent(message, { ...options, level: 'WARNING' });
}

function error(message, options = {}) {
    return logEvent(message, { ...options, level: 'ERROR' });
}

function success(message, options = {}) {
    return logEvent(message, { ...options, level: 'SUCCESS' });
}

function debugLog(...args) {
    // Print to console and send to log channel if possible
    console.debug('[DEBUG]', ...args);
    if (clientInstance) {
        const message = args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ');
        logEvent(message, {
            level: 'DEBUG',
            title: 'Debug Log'
        });
    }
}

module.exports = {
    setClient,
    logEvent,
    info,
    warning,
    error,
    success,
    debugLog,
};
