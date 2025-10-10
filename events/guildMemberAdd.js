const { Events } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const config = await getConfig(member.guild.id);

        if (!config.welcomeEnabled) return;

        // Auto-Role Logic
        if (config.welcomeRoleId) {
            const role = member.guild.roles.cache.get(config.welcomeRoleId);
            if (role) {
                member.roles.add(role).catch(err => console.error(`Failed to add role to ${member.user.tag}:`, err));
            }
        }

        // Welcome Message Logic
        if (config.welcomeChannelId) {
            const channel = member.guild.channels.cache.get(config.welcomeChannelId);
            if (channel) {
                const welcomeMessage = config.welcomeMessage
                    .replace('{user}', member.toString())
                    .replace('{servername}', member.guild.name)
                    .replace('{servermembercount}', member.guild.memberCount.toString());
                
                channel.send(welcomeMessage).catch(err => console.error(`Failed to send welcome message:`, err));
            }
        }
    },
};
