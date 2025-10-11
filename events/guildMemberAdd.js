const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getConfig } = require('../configManager');
const { WelcomeCard } = require('pixel-musicard');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const config = await getConfig(member.guild.id);

        // --- Auto-Role: assign regardless of welcome message settings ---
        if (config.welcomeRoleId) {
            const role = member.guild.roles.cache.get(config.welcomeRoleId);
            if (role) {
                member.roles.add(role).catch(err => console.error(`Failed to add autorole:`, err));
            }
        }
        // Determine welcome enablement (default to true if legacy config had a channel set)
        const welcomeEnabled = typeof config.welcomeEnabled === 'boolean'
            ? config.welcomeEnabled
            : Boolean(config.welcomeChannelId);

        // If welcome system isn't fully configured, stop here (we already handled autorole)
        if (!welcomeEnabled || !config.welcomeChannelId) return;

        const useWelcomeCard = typeof config.useWelcomeCard === 'boolean' ? config.useWelcomeCard : true;

        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (!channel) return;

        // Shared placeholders used for both card and embed
        const placeholders = {
            '{{memberName}}': member.displayName,
            '{{memberTag}}': member.user.tag,
            '{{memberMention}}': member.toString(),
            '{{memberID}}': member.id,
            '{{memberAvatar}}': member.user.displayAvatarURL({ extension: 'png' }),
            '{{accountCreated}}': member.user.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            '{{serverName}}': member.guild.name,
            '{{serverIcon}}': member.guild.iconURL(),
            '{{memberCount}}': member.guild.memberCount?.toString() || '0',
            '{{boostCount}}': (member.guild.premiumSubscriptionCount || 0).toString(),
            '{{boostLevel}}': (member.guild.premiumTier || '0').toString().replace('Tier', 'Level'),
        };

        // Helper to apply placeholders to a string
        const applyPlaceholders = (text = '') => {
            let out = String(text);
            for (const [key, value] of Object.entries(placeholders)) {
                out = out.replace(new RegExp(key, 'g'), value || 'N/A');
            }
            return out;
        };

        // Attempt to use WelcomeCard (pixel-musicard) when configured; otherwise fallback to embed
        if (useWelcomeCard && typeof WelcomeCard === 'function') {
            try {
                const card = await WelcomeCard({
                    username: member.user.username,
                    avatar: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                    guildName: member.guild.name,
                    memberCount: member.guild.memberCount,
                    joinDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
                    joinTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    guildPosition: member.guild.memberCount,
                    discriminator: member.user.discriminator
                });

                const attachment = new AttachmentBuilder(card, { name: 'welcome.png' });
                const welcomeText = applyPlaceholders(config.welcomeMessage || '');

                await channel.send({ content: welcomeText || undefined, files: [attachment] });
                return;
            } catch (error) {
                console.error('Error generating welcome card, falling back to embed:', error);
                // continue to embed fallback
            }
        }

        // Fallback: send templated message or embed
        try {
            const welcomeText = applyPlaceholders(config.welcomeMessage || `Welcome to ${member.guild.name}, ${member.toString()}!`);

            // If there's a plain text welcome message configured, send it (optionally as content)
            if (welcomeText && welcomeText.trim().length > 0) {
                await channel.send({ content: welcomeText }).catch(err => console.error('Failed to send welcome text:', err));
            } else {
                // Build an embed as a safer fallback
                const welcomeEmbed = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle(`Welcome to ${member.guild.name}!`)
                    .setDescription(welcomeText || `We now have ${member.guild.memberCount} members`)
                    .setThumbnail(member.user.displayAvatarURL({ extension: 'png' }))
                    .setFooter({ text: `We now have ${member.guild.memberCount} members` })
                    .setTimestamp();

                await channel.send({ embeds: [welcomeEmbed] }).catch(err => console.error('Failed to send welcome embed:', err));
            }
        } catch (err) {
            console.error('Failed to send welcome (unexpected):', err);
        }
    },
};
