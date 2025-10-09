const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-welcome-channel')
        .setDescription('Set the channel for welcome messages.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option => option.setName('channel').setDescription('The channel for welcome messages').addChannelTypes(ChannelType.GuildText).setRequired(true)),
    async execute(interaction) {
        const guildId = interaction.guild.id;
        const channel = interaction.options.getChannel('channel');
        setConfig(guildId, 'welcomeChannelId', channel.id);
        await interaction.reply({ content: `✅ Welcome channel set to **${channel.name}**.`, ephemeral: true });
    },
};
