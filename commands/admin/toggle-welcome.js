const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle-welcome')
        .setDescription('Enables or disables the welcome system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option =>
            option.setName('enabled').setDescription('Set to true to enable, false to disable').setRequired(true)),
    async execute(interaction) {
        const isEnabled = interaction.options.getBoolean('enabled');
        await setConfig(interaction.guild.id, 'welcomeEnabled', isEnabled);
        await interaction.reply({ content: `✅ Welcome system has been **${isEnabled ? 'enabled' : 'disabled'}**.`, flags: [ 'Ephemeral' ] });
    },
};
