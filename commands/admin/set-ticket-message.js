const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-ticket-message')
        .setDescription('Set the message for the ticket creation panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option => option.setName('title').setDescription('The title of the panel embed').setRequired(true))
        .addStringOption(option => option.setName('description').setDescription('The description of the panel embed').setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        setConfig(guildId, 'ticketPanelTitle', title);
        setConfig(guildId, 'ticketPanelDescription', description);
        await interaction.reply({ content: `✅ Ticket panel message updated.`, ephemeral: true });
    },
};
