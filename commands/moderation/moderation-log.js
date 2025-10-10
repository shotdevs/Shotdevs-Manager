const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const configManager = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moderation-log')
        .setDescription('Manually log a moderation action to the modlog channel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user who is the target of the action.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('action')
                .setDescription('The moderation action (e.g., Ban, Kick, Warn, Timeout, etc).')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('details')
                .setDescription('Additional details or reason for the action.')
                .setRequired(false)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const action = interaction.options.getString('action');
        const details = interaction.options.getString('details') || 'No additional details.';
        const moderator = interaction.user;

        // Find modlog channel from config
        const guildConfig = await configManager.getConfig(interaction.guild.id);
        const modlogChannelId = guildConfig && (guildConfig.modlogChannelId || guildConfig.modLogChannelId || guildConfig.moderationLogChannelId);
        if (!modlogChannelId) {
            return interaction.reply({ content: 'No moderation log channel is configured for this server.', ephemeral: true });
        }
        const modlogChannel = interaction.guild.channels.cache.get(modlogChannelId);
        if (!modlogChannel) {
            return interaction.reply({ content: 'The configured moderation log channel does not exist.', ephemeral: true });
        }

        const logEmbed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle('Manual Moderation Log')
            .addFields(
                { name: 'Action', value: action, inline: true },
                { name: 'Target', value: `${target.tag} (${target.id})`, inline: true },
                { name: 'Moderator', value: `${moderator.tag} (${moderator.id})`, inline: true },
                { name: 'Details', value: details }
            )
            .setTimestamp();

        await modlogChannel.send({ embeds: [logEmbed] });
        await interaction.reply({ content: 'Moderation action logged.', ephemeral: true });
    },
};
