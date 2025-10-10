const { Events, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const config = await getConfig(member.guild.id);

        if (!config.welcomeEnabled || !config.welcomeChannelId || !config.welcomeMessage) {
            return; // Exit if the system is disabled or not fully configured
        }

        // --- Auto-Role Logic ---
        if (config.welcomeRoleId) {
            const role = member.guild.roles.cache.get(config.welcomeRoleId);
            if (role) {
                member.roles.add(role).catch(err => console.error(`Failed to add role:`, err));
            }
        }

        // --- Welcome Message Logic ---
        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (channel) {
            // Define all the placeholders and their values
            const placeholders = {
                '{{memberName}}': member.displayName,
                '{{memberTag}}': member.user.tag,
                '{{memberMention}}': member.toString(),
                '{{memberID}}': member.id,
                '{{memberAvatar}}': member.user.displayAvatarURL(),
                '{{accountCreated}}': member.user.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                '{{serverName}}': member.guild.name,
                '{{serverIcon}}': member.guild.iconURL(),
                '{{memberCount}}': member.guild.memberCount.toString(),
                '{{boostCount}}': member.guild.premiumSubscriptionCount.toString(),
                '{{boostLevel}}': member.guild.premiumTier.toString().replace('Tier', 'Level'),
            };

            // Replace all placeholders in the message
            let welcomeMessage = config.welcomeMessage;
            for (const [key, value] of Object.entries(placeholders)) {
                // Use a RegExp to replace all occurrences of the placeholder
                welcomeMessage = welcomeMessage.replace(new RegExp(key, 'g'), value);
            }
            
            // Send the final message
            channel.send(welcomeMessage).catch(err => console.error(`Failed to send welcome message:`, err));
        }
    },
};
