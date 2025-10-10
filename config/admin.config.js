const adminConfig = {
    // Default welcome message configuration
    welcome: {
        defaultMessage: 'Welcome {user} to {servername}!',
        enabled: false
    },

    // Ticket system configuration
    tickets: {
        defaultPanelTitle: 'Support Tickets',
        defaultPanelDescription: 'Click the button below to create a support ticket.',
        defaultMessageContent: 'Thank you for creating a ticket. Our staff will assist you shortly.',
        categories: {
            order: 'Orders',
            enquiry: 'Enquiries',
            support: 'Support'
        }
    },

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