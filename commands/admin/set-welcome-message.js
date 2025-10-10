const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-welcome-message')
        .setDescription('Sets the welcome message. Use /welcome-help to see placeholders.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => 
            option.setName('message').setDescription('The welcome message string.').setRequired(true)),
    async execute(interaction) {
        const message = interaction.options.getString('message');
        await setConfig(interaction.guild.id, 'welcomeMessage', message);
        await interaction.reply({ content: '✅ Welcome message has been updated.', flags: [ 'Ephemeral' ] });
    },
};
