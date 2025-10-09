const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-log-channel')
        .setDescription('Set the channel where ticket logs will be sent.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => option.setName('channel').setDescription('The text channel for logs').addChannelTypes(ChannelType.GuildText).setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const channel = interaction.options.getChannel('channel');
        setConfig(guildId, 'ticketLogChannelId', channel.id);
        await interaction.reply({ content: `✅ Ticket log channel has been set to **${channel.name}**.`, ephemeral: true });
    },
};
