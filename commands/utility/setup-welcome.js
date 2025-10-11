const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig, getConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup-welcome')
        .setDescription('Configure the welcome system for this server.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(opt => opt.setName('welcome_channel').setDescription('Channel for welcome messages').addChannelTypes(0))
        .addStringOption(opt => opt.setName('welcome_message').setDescription('Welcome message text'))
        .addStringOption(opt => opt.setName('welcome_image').setDescription('URL of welcome image'))
        .addStringOption(opt => opt.setName('welcome_embed_color').setDescription('Hex color for welcome embed (e.g. #00ff99)')),

    async execute(interaction) {
        let updated = false;
        const options = [
            { key: 'welcomeChannelId', value: interaction.options.getChannel('welcome_channel')?.id },
            { key: 'welcomeMessage', value: interaction.options.getString('welcome_message') },
            { key: 'welcomeImage', value: interaction.options.getString('welcome_image') },
            { key: 'welcomeEmbedColor', value: interaction.options.getString('welcome_embed_color') },
        ];
        const { logEvent } = require('../../logger');
        for (const opt of options) {
            if (opt.value) {
                await setConfig(interaction.guild.id, opt.key, opt.value);
                updated = true;
                logEvent(`:wave: Welcome config updated: **${opt.key}** set to  ${opt.value}`);
            }
        }
        if (updated) {
            await interaction.reply({ content: '✅ Welcome configuration updated.', ephemeral: true });
        } else {
            const { debugLog } = require('../../logger');
            debugLog('No options provided to /setup-welcome by', interaction.user?.id);
            await interaction.reply({ content: 'No options provided. Please specify at least one setting to update.', ephemeral: true });
        }
    },
};
