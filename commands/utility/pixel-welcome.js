const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig, getConfig } = require('../../configManager');
const { WelcomeCard } = require('pixel-musicard');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pixel-welcome')
        .setDescription('Configure the cyberpunk welcome card for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(opt =>
            opt
                .setName('enabled')
                .setDescription('Enable or disable the welcome card')
                .setRequired(false)
        )
        .addChannelOption(opt =>
            opt
                .setName('channel')
                .setDescription('Channel where the welcome card should be sent')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt
                .setName('message')
                .setDescription('Custom welcome message with placeholders (optional)')
                .setRequired(false)
        )
        .addBooleanOption(opt =>
            opt
                .setName('use_card')
                .setDescription('Whether to use the pixel welcome card (default true)')
                .setRequired(false)
        )
        .addStringOption(opt =>
            opt
                .setName('preview')
                .setDescription('Preview the current configuration without saving')
                .addChoices(
                    { name: 'Send preview in the configured channel', value: 'channel' },
                    { name: 'Show preview as an ephemeral reply', value: 'reply' }
                )
        ),

    async execute(interaction) {
        if (!interaction.isRepliable()) {
            console.log(`Interaction ${interaction.id} is no longer repliable`);
            return;
        }

        const guildId = interaction.guild.id;
        const config = await getConfig(guildId);

        const enabledOption = interaction.options.getBoolean('enabled');
        const channelOption = interaction.options.getChannel('channel');
        const messageOption = interaction.options.getString('message');
        const useCardOption = interaction.options.getBoolean('use_card');
        const previewOption = interaction.options.getString('preview');

        const applyPlaceholders = (text = '', member) => {
            const placeholders = {
                '{{memberName}}': member.displayName,
                '{{memberTag}}': member.user.tag,
                '{{memberMention}}': member.toString(),
                '{{memberID}}': member.id,
                '{{memberAvatar}}': member.user.displayAvatarURL({ extension: 'png' }),
                '{{accountCreated}}': member.user.createdAt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                '{{serverName}}': interaction.guild.name,
                '{{serverIcon}}': interaction.guild.iconURL(),
                '{{memberCount}}': interaction.guild.memberCount?.toString() || '0',
                '{{boostCount}}': (interaction.guild.premiumSubscriptionCount || 0).toString(),
                '{{boostLevel}}': (interaction.guild.premiumTier || '0').toString().replace('Tier', 'Level'),
            };

            let out = String(text);
            for (const [key, value] of Object.entries(placeholders)) {
                out = out.replace(new RegExp(key, 'g'), value || 'N/A');
            }
            return out;
        };

        if (previewOption) {
            const channelId = channelOption?.id || config.welcomeChannelId;
            const channel = channelId ? interaction.guild.channels.cache.get(channelId) : null;
            const welcomeEnabled = typeof enabledOption === 'boolean' ? enabledOption : config.welcomeEnabled;
            const useWelcomeCard = typeof useCardOption === 'boolean' ? useCardOption : config.useWelcomeCard;
            const welcomeMessage = messageOption || config.welcomeMessage || `Welcome to ${interaction.guild.name}, {{memberMention}}!`;

            if (!welcomeEnabled) {
                return interaction.reply({
                    content: '⚠️ Welcome card system is disabled. Enable it first with `/pixel-welcome enabled:true`.',
                    flags: ['Ephemeral']
                });
            }

            if (!channel) {
                return interaction.reply({
                    content: '⚠️ No welcome channel configured. Provide one with `/pixel-welcome channel:#channel`.',
                    flags: ['Ephemeral']
                });
            }

            if (!channel.isTextBased()) {
                return interaction.reply({
                    content: '⚠️ The configured channel is not a text-based channel.',
                    flags: ['Ephemeral']
                });
            }

            if (!useWelcomeCard) {
                return interaction.reply({
                    content: 'ℹ️ Welcome card usage is disabled. Set `use_card:true` to enable it.',
                    flags: ['Ephemeral']
                });
            }

            try {
                const card = await WelcomeCard({
                    username: interaction.user.username,
                    avatar: interaction.user.displayAvatarURL({ extension: 'png', size: 256 }),
                    guildName: interaction.guild.name,
                    memberCount: interaction.guild.memberCount,
                    joinDate: new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }),
                    joinTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                    guildPosition: interaction.guild.memberCount,
                    discriminator: interaction.user.discriminator
                });

                if (previewOption === 'channel') {
                    await channel.send({
                        content: applyPlaceholders(welcomeMessage, interaction.member),
                        files: [{ attachment: card, name: 'welcome-preview.png' }]
                    });
                    return interaction.reply({ content: '✅ Preview sent to the configured channel.', flags: ['Ephemeral'] });
                }

                if (previewOption === 'reply') {
                    return interaction.reply({
                        content: 'Here is a preview of the welcome card.',
                        files: [{ attachment: card, name: 'welcome-preview.png' }],
                        flags: ['Ephemeral']
                    });
                }
            } catch (error) {
                console.error('Failed to generate welcome card preview:', error);
                return interaction.reply({ content: '❌ Failed to generate welcome card preview.', flags: ['Ephemeral'] });
            }

            return;
        }

        const updates = [];
        if (typeof enabledOption === 'boolean') {
            updates.push(setConfig(guildId, 'welcomeEnabled', enabledOption));
        }
        if (channelOption) {
            updates.push(setConfig(guildId, 'welcomeChannelId', channelOption.id));
        }
        if (typeof useCardOption === 'boolean') {
            updates.push(setConfig(guildId, 'useWelcomeCard', useCardOption));
        }
        if (messageOption) {
            updates.push(setConfig(guildId, 'welcomeMessage', messageOption));
        }

        if (updates.length === 0) {
            return interaction.reply({ content: 'No options provided to update.', flags: ['Ephemeral'] });
        }

        try {
            await Promise.all(updates);
            return interaction.reply({ content: '✅ Welcome card configuration updated.', flags: ['Ephemeral'] });
        } catch (error) {
            console.error('Failed to update welcome card configuration:', error);
            return interaction.reply({ content: '❌ Error updating welcome card configuration.', flags: ['Ephemeral'] });
        }
    },
};
