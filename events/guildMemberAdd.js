const { Events } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        // FIXED: Added 'await' to get the configuration from the database
        const config = await getConfig(member.guild.id);

        // This check is fine, it will now work correctly
        if (!config.welcomeEnabled) return;

        // Send welcome message
        if (config.welcomeChannelId && config.welcomeMessage) {
            const channel = member.guild.channels.cache.get(config.welcomeChannelId);
            if (channel) {
                const msg = config.welcomeMessage
                    .replace('{user}', `<@${member.id}>`)
                    .replace('{server}', member.guild.name);
                
                channel.send({ content: msg }).catch(error => {
                    console.error(`Could not send welcome message to channel ${channel.id}:`, error);
                });
            }
        }

        // Assign role
        if (config.welcomeRoleId) {
            const role = member.guild.roles.cache.get(config.welcomeRoleId);
            if (role) {
                // IMPROVED: Added error logging
                member.roles.add(role).catch(error => {
                    console.error(`Could not add role ${role.id} to user ${member.id}:`, error);
                });
            }
        }

        // Optionally, send DM
        if (config.welcomeDM) {
            const msg = config.welcomeMessage
                .replace('{user}', member.user.username)
                .replace('{server}', member.guild.name);
            
            // IMPROVED: Added error logging
            member.send({ content: msg }).catch(error => {
                console.error(`Could not send welcome DM to user ${member.id}:`, error);
            });
        }
    },
};
