const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('toggle-welcome')
        .setDescription('Enable or disable the welcome system.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addBooleanOption(option => option.setName('enabled').setDescription('Enable or disable welcome system').setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const enabled = interaction.options.getBoolean('enabled');
        setConfig(guildId, 'welcomeEnabled', enabled);
        await interaction.reply({ content: `✅ Welcome system has been ${enabled ? 'enabled' : 'disabled'}.`, ephemeral: true });
    },
};
