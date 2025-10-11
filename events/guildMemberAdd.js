const { Events, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getConfig } = require('../configManager');
const { WelcomeCard } = require('pixel-musicard');

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

        // --- Welcome Message Logic (Updated for Pixel Musicard) ---
        const channel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (channel) {
            try {
                // Generate welcome card using pixel-musicard
                const card = await WelcomeCard({
                    username: member.user.username,
                    avatar: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                    guildName: member.guild.name,
                    memberCount: member.guild.memberCount,
                    joinDate: new Date().toLocaleDateString('en-US', { 
                        month: '2-digit', 
                        day: '2-digit', 
                        year: 'numeric' 
                    }),
                    joinTime: new Date().toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        hour12: true 
                    }),
                    guildPosition: member.guild.memberCount,
                    discriminator: member.user.discriminator
                });

                // Create attachment
                const attachment = new AttachmentBuilder(card, { 
                    name: 'welcome.png' 
                });

                // Process custom welcome message with placeholders
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

                // Send welcome message with card
                await channel.send({
                    content: welcomeText,
                    files: [attachment]
                });

            } catch (error) {
                console.error('Error generating welcome card:', error);
                
                // Fallback to embed if card generation fails
                const welcomeEmbed = new EmbedBuilder()
                    .setColor(0xED4245)
                    .setTitle(`Welcome to ${member.guild.name}!`)
                    .setDescription(config.welcomeMessage)
                    .setThumbnail(member.user.displayAvatarURL())
                    .setFooter({ text: `We now have ${member.guild.memberCount} members` })
                    .setTimestamp();

                channel.send({ embeds: [welcomeEmbed] }).catch(err => 
                    console.error(`Failed to send fallback welcome embed:`, err)
                );
            }
        }
    },
};
