const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-log-channel')
        .setDescription('Sets the channel where ticket logs will be sent.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The text channel for logs')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        // This now correctly saves the 'ticketLogChannelId'
        await setConfig(interaction.guild.id, 'ticketLogChannelId', channel.id);
        // This now sends the correct reply message
        await interaction.reply({ content: `✅ Ticket log channel has been set to **${channel.name}**.`, flags: [ 'Ephemeral' ] });
    },
};
