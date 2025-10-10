const adminConfig = {
    // Default welcome message configuration
    welcome: {
        defaultMessage: 'Welcome {user} to {servername}!',
        enabled: false
    },

    // (ticket system configuration removed - using DB/command-driven config only)

    // Role configuration
    roles: {
        // Permission levels for different role types
        permissionLevels: {
            admin: ['ADMINISTRATOR'],
            moderator: ['MANAGE_MESSAGES', 'KICK_MEMBERS', 'BAN_MEMBERS']
        }
    },

    // Command cooldowns and limits
    commandLimits: {
        clear: {
            maxMessages: 100,
            cooldown: 5000 // 5 seconds
        },
        timeout: {
            maxDuration: 28 * 24 * 60 * 60 * 1000 // 28 days in milliseconds
        }
    }
};

module.exports = adminConfig;