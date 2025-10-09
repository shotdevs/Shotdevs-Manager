const { Events } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const config = getConfig(member.guild.id);
        if (!config.welcomeEnabled) return;
        // Send welcome message
        if (config.welcomeChannelId && config.welcomeMessage) {
            const channel = member.guild.channels.cache.get(config.welcomeChannelId);
            if (channel) {
                const msg = config.welcomeMessage
                    .replace('{user}', `<@${member.id}>`)
                    .replace('{server}', member.guild.name);
                channel.send({ content: msg });
            }
        }
        // Assign role
        if (config.welcomeRoleId) {
            const role = member.guild.roles.cache.get(config.welcomeRoleId);
            if (role) {
                member.roles.add(role).catch(() => {});
            }
        }
        // Optionally, send DM
        if (config.welcomeDM) {
            const msg = config.welcomeMessage
                .replace('{user}', member.user.username)
                .replace('{server}', member.guild.name);
            member.send({ content: msg }).catch(() => {});
        }
    },
};
