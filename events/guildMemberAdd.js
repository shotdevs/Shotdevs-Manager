const { Events, EmbedBuilder } = require('discord.js');
const { getConfig } = require('../configManager');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const config = await getConfig(member.guild.id);

        if (!config.welcomeEnabled || !config.welcomeChannelId || !config.welcomeMessage) {
            return; // Exit if the system is disabled or not fully configured
        }

        // --- Auto-Role Logic (unchanged) ---
        if (config.welcomeRoleId) {
            const role = member.guild.roles.cache.get(config.welcomeRoleId);
            if (role) {
                member.roles.add(role).catch(err => console.error(`Failed to add role:`, err));
            }
        }

        // --- Welcome Message Logic (Updated for Embed) ---
        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (channel) {
            // Placeholder logic is the same
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

            let welcomeText = config.welcomeMessage;
            for (const [key, value] of Object.entries(placeholders)) {
                welcomeText = welcomeText.replace(new RegExp(key, 'g'), value || 'N/A');
            }
            
            // NEW: Create the embed
            const welcomeEmbed = new EmbedBuilder()
                .setColor(0xED4245) // Red color, as requested
                .setTitle(`Welcome to ${member.guild.name}!`)
                .setDescription(welcomeText) // Your custom message goes here
                .setThumbnail(member.user.displayAvatarURL()) // Sets the new member's avatar on the side
                .setFooter({ text: `We now have ${member.guild.memberCount} members` })
                .setTimestamp();

            // CHANGED: Send the embed instead of plain text
            channel.send({ embeds: [welcomeEmbed] }).catch(err => console.error(`Failed to send welcome embed:`, err));
        }
    },
};
