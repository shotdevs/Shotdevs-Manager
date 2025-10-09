const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-welcome-message')
        .setDescription('Set the welcome message for new members.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('message').setDescription('The welcome message. Use {user} for the new member and {server} for the server name.').setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const message = interaction.options.getString('message');
        setConfig(guildId, 'welcomeMessage', message);
        await interaction.reply({ content: '✅ Welcome message updated.', ephemeral: true });
    },
};
