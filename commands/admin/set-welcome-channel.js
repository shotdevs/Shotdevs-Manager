const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { setConfig } = require('../../configManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-welcome-channel')
        .setDescription('Sets the channel for welcome messages.')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption(option =>
            option.setName('channel').setDescription('The welcome channel').addChannelTypes(ChannelType.GuildText).setRequired(true)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        await setConfig(interaction.guild.id, 'welcomeChannelId', channel.id);
        await interaction.reply({ content: `✅ Welcome channel set to **${channel.name}**.`, flags: [ 'Ephemeral' ] });
    },
};
