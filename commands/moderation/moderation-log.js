const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const configManager = require('../../configManager');
const {
    container,
    section,
    separator,
    sendComponentsV2Message
} = require('../../utils/componentsV2Builder');

// Log to confirm the file is being loaded by your command handler
console.log('[LOAD] Command "moderation-log" is being loaded.');

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
        const details = interaction.options.getString('details') || 'No additional details provided.';
        const moderator = interaction.user;

        let guildConfig;
        try {
            guildConfig = await configManager.getConfig(interaction.guild.id);
        } catch (error) {
            console.error(`Error fetching config for guild ${interaction.guild.id}:`, error);
            return interaction.reply({ content: 'There was an error retrieving the server configuration.', ephemeral: true });
        }
        
        const modlogChannelId = guildConfig?.modlogChannelId || guildConfig?.modLogChannelId || guildConfig?.moderationLogChannelId;
        
        if (!modlogChannelId) {
            return interaction.reply({ content: 'The moderation log channel has not been configured for this server.', ephemeral: true });
        }

        const modlogChannel = interaction.guild.channels.cache.get(modlogChannelId);
        if (!modlogChannel) {
            return interaction.reply({ content: 'The configured moderation log channel could not be found. It may have been deleted.', ephemeral: true });
        }

        // Send log with Components V2
        try {
            await sendComponentsV2Message(interaction.client, modlogChannel.id, {
                components: [
                    container({
                        components: [
                            section({
                                content: '# Manual Moderation Log'
                            }),
                            separator(),
                            section({
                                content: `**Action:** ${action}\n**Target User:** ${target.tag} (${target.id})\n**Moderator:** ${moderator.tag} (${moderator.id})\n**Details:** ${details}`
                            }),
                            separator(),
                            section({
                                content: `**Guild ID:** ${interaction.guild.id}`
                            })
                        ]
                    })
                ]
            });
            await interaction.reply({ content: 'Moderation action has been successfully logged.', ephemeral: true });
        } catch (error) {
            console.error(`Could not send message to modlog channel ${modlogChannelId} in guild ${interaction.guild.id}:`, error);
            await interaction.reply({ content: 'The action was logged, but I failed to send the confirmation message to the modlog channel. Please check my permissions in that channel.', ephemeral: true });
        }
    },
};
